import { useState } from 'react';
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import {
  GradientHero,
  GlassCard,
  SectionHeader,
  PremiumButton,
  DecorativeBlob,
  BackgroundPattern,
  GradientText
} from '@/components/premium-ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Trash2, Download, Check, Search, Sparkles, List, Edit2, X, Store } from 'lucide-react';
import { getIngredientIcon } from '@/lib/ingredientIcons';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { shoppingListSchema, shoppingListItemSchema, type ShoppingListFormData, type ShoppingListItemFormData } from '@/lib/validation';
import { Skeleton } from '@/components/ui/skeleton';
import { sendToGroceryStore, copyToClipboard, getAllStores, type GroceryStore } from '@/lib/groceryStores';

export default function ShoppingListsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renamingListId, setRenamingListId] = useState<number | null>(null);
  const [renameListName, setRenameListName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [addItemIngredientId, setAddItemIngredientId] = useState<number | null>(null);
  const [addItemQuantity, setAddItemQuantity] = useState('');
  const [addItemUnit, setAddItemUnit] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [listFormErrors, setListFormErrors] = useState<Partial<Record<keyof ShoppingListFormData, string>>>({});
  const [itemFormErrors, setItemFormErrors] = useState<Partial<Record<keyof ShoppingListItemFormData, string>>>({});

  const utils = trpc.useUtils();
  const { data: shoppingLists, isLoading: listsLoading } = trpc.shoppingLists.list.useQuery();
  const { data: selectedList, isLoading: selectedListLoading } = trpc.shoppingLists.getById.useQuery(
    { id: selectedListId! },
    { enabled: !!selectedListId }
  );
  const { data: listItems, isLoading: itemsLoading } = trpc.shoppingLists.getItems.useQuery(
    { id: selectedListId! },
    { enabled: !!selectedListId }
  );
  const { data: allIngredients, isLoading: ingredientsLoading } = trpc.ingredients.list.useQuery();

  const createListMutation = trpc.shoppingLists.create.useMutation({
    onSuccess: async (data) => {
      try {
        // Invalidate and refetch the lists
        await utils.shoppingLists.list.invalidate();
        
        // Get the ID from the returned data
        const listId = (data as any)?.id;
        if (listId) {
          setSelectedListId(Number(listId));
        } else {
          // Fallback: refetch the list and select the newest one
          const lists = await utils.client.shoppingLists.list.query();
          if (lists && lists.length > 0) {
            const newestList = lists.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            setSelectedListId(newestList.id);
          }
        }
        
        // Clear form and close dialog
        setNewListName('');
        setNewListDescription('');
        setListFormErrors({});
        setIsCreateDialogOpen(false);
        toast.success('Shopping list created successfully');
      } catch (error: any) {
        console.error('Error handling create success:', error);
        toast.error('List created but failed to select it');
      }
    },
    onError: (error: any) => {
      console.error('Create list error:', error);
      const errorMessage = error?.message || error?.data?.message || 'Failed to create shopping list';
      toast.error(errorMessage);
    },
  });

  const updateListMutation = trpc.shoppingLists.update.useMutation({
    onSuccess: () => {
      utils.shoppingLists.list.invalidate();
      if (selectedListId) {
        utils.shoppingLists.getById.invalidate({ id: selectedListId });
      }
      setIsRenameDialogOpen(false);
      setRenamingListId(null);
      setRenameListName('');
      toast.success('Shopping list renamed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to rename list');
    },
  });

  const deleteListMutation = trpc.shoppingLists.delete.useMutation({
    onSuccess: () => {
      utils.shoppingLists.list.invalidate();
      setSelectedListId(null);
      toast.success('Shopping list deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete list');
    },
  });

  const toggleItemMutation = trpc.shoppingLists.toggleItem.useMutation({
    onSuccess: () => {
      if (selectedListId) {
        utils.shoppingLists.getItems.invalidate({ id: selectedListId });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update item');
    },
  });

  const removeItemMutation = trpc.shoppingLists.removeItem.useMutation({
    onSuccess: () => {
      if (selectedListId) {
        utils.shoppingLists.getItems.invalidate({ id: selectedListId });
      }
      toast.success('Item removed');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove item');
    },
  });

  const addItemMutation = trpc.shoppingLists.addItem.useMutation({
    onSuccess: async (data) => {
      console.log('Add item mutation success, data:', data);
      if (selectedListId) {
        // Invalidate and refetch the items
        await utils.shoppingLists.getItems.invalidate({ id: selectedListId });
        // Also refetch to ensure UI updates
        await utils.shoppingLists.getItems.refetch({ id: selectedListId });
      }
      toast.success('Item added to list');
    },
    onError: (error) => {
      console.error('Add item mutation error:', error);
      console.error('Error message:', error.message);
      console.error('Error data:', error.data);
      toast.error(error.message || 'Failed to add item');
    },
  });

  const handleCreateList = () => {
    const result = shoppingListSchema.safeParse({
      name: newListName,
      description: newListDescription,
    });
    
    if (!result.success) {
      const errors: Partial<Record<keyof ShoppingListFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof ShoppingListFormData] = err.message;
        }
      });
      setListFormErrors(errors);
      if (result.error.errors[0]) {
        toast.error(result.error.errors[0].message);
      }
      return;
    }
    
    setListFormErrors({});
    createListMutation.mutate({
      name: newListName,
      description: newListDescription || undefined,
    });
  };

  const handleAddItem = async () => {
    if (!selectedListId) {
      toast.error('Please select a shopping list');
      return;
    }
    
    const result = shoppingListItemSchema.safeParse({
      ingredientId: addItemIngredientId || 0,
      quantity: addItemQuantity,
      unit: addItemUnit,
    });
    
    if (!result.success) {
      const errors: Partial<Record<keyof ShoppingListItemFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof ShoppingListItemFormData] = err.message;
        }
      });
      setItemFormErrors(errors);
      if (result.error.errors[0]) {
        toast.error(result.error.errors[0].message);
      }
      return;
    }
    
    const payload = {
      shoppingListId: selectedListId,
      ingredientId: addItemIngredientId!,
      quantity: addItemQuantity || undefined,
      unit: addItemUnit || undefined,
    };
    
    try {
      await addItemMutation.mutateAsync(payload);
      
      // Close dialog and reset form on success
      setIsAddItemDialogOpen(false);
      setAddItemIngredientId(null);
      setAddItemQuantity('');
      setAddItemUnit('');
      setIngredientSearch('');
      setItemFormErrors({});
    } catch (error: any) {
      // Error is already handled by onError in the mutation
      // Don't close dialog on error so user can try again
    }
  };

  const filteredIngredients = allIngredients?.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  ) || [];

  const handleExport = async (format: 'csv' | 'txt' | 'md' | 'json' | 'pdf') => {
    if (!selectedListId) {
      toast.error('Please select a shopping list');
      return;
    }

    try {
      const result = await utils.client.shoppingLists.export.query({
        id: selectedListId,
        format,
      });

      // Create download
      let blob: Blob;
      if (format === 'pdf') {
        // PDF content is base64 encoded
        const binaryString = atob(result.content as string);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: result.mimeType });
      } else {
        blob = new Blob([result.content as string], { type: result.mimeType });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export list');
    }
  };

  const handleSendToStore = async (store: GroceryStore) => {
    if (!selectedListId || !listItems || listItems.length === 0) {
      toast.error('Please select a shopping list with items');
      return;
    }

    try {
      // Get unchecked items only
      const uncheckedItems = listItems
        .filter(item => !item.isChecked)
        .map(item => {
          const ingredient = allIngredients?.find(i => i.id === item.ingredientId);
          return {
            name: ingredient?.name || 'Unknown',
            quantity: item.quantity,
            unit: item.unit,
          };
        });

      if (uncheckedItems.length === 0) {
        toast.error('All items are already checked off!');
        return;
      }

      if (store === 'clipboard') {
        await copyToClipboard(uncheckedItems, 'withQuantity');
        toast.success('Shopping list copied to clipboard!');
      } else {
        const storeConfig = getAllStores().find(s => s.id === store);
        const useHomepage = uncheckedItems.length > 10;
        await sendToGroceryStore(uncheckedItems, store, { maxTabs: 10 });
        
        if (useHomepage) {
          toast.success(`Opening ${storeConfig?.name} homepage...`, {
            description: 'Shopping list copied to clipboard',
          });
        } else {
          toast.success(`Opening ${uncheckedItems.length} items in ${storeConfig?.name}...`, {
            description: 'Check your browser for new tabs',
          });
        }
      }
    } catch (error: any) {
      console.error('Send to store error:', error);
      toast.error(error.message || 'Failed to send to store');
    }
  };

  const checkedCount = listItems?.filter(item => item.isChecked).length || 0;
  const totalCount = listItems?.length || 0;

  return (
    <div className="relative space-y-8 pb-16">
      {/* Background decorative elements */}
      <DecorativeBlob
        color="tan"
        position="top-right"
        size="lg"
        opacity={0.1}
      />
      <DecorativeBlob
        color="olive"
        position="bottom-left"
        size="md"
        opacity={0.08}
      />

      {/* Hero Header */}
      <div className="flex items-start justify-between gap-6">
        <GradientHero
          badge={
            <div className="inline-flex items-center gap-2">
              <List className="h-4 w-4" />
              Smart Shopping
            </div>
          }
          title="Shopping Lists"
          subtitle="Organized grocery planning"
          description="Create and manage your shopping lists with ease. Export to multiple formats and never forget an ingredient."
          className="flex-1"
        />
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <PremiumButton size="lg" color="tan" className="mt-4">
              <Plus className="h-4 w-4" />
              New List
            </PremiumButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shopping List</DialogTitle>
              <DialogDescription>
                Create a new shopping list for your grocery trips
              </DialogDescription>
            </DialogHeader>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateList();
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="listName">List Name *</Label>
                <Input
                  id="listName"
                  placeholder="e.g., Weekly Groceries"
                  value={newListName}
                  onChange={(e) => {
                    setNewListName(e.target.value);
                    if (listFormErrors.name) {
                      setListFormErrors({ ...listFormErrors, name: undefined });
                    }
                  }}
                  className={cn("border-pc-tan/20", listFormErrors.name && "border-red-500")}
                  autoFocus
                  aria-invalid={!!listFormErrors.name}
                  aria-describedby={listFormErrors.name ? 'listName-error' : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newListName.trim()) {
                      e.preventDefault();
                      handleCreateList();
                    }
                  }}
                />
                {listFormErrors.name && (
                  <p id="listName-error" className="text-sm text-red-600 mt-1" role="alert">
                    {listFormErrors.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="listDescription">Description (optional)</Label>
                <Input
                  id="listDescription"
                  placeholder="e.g., For dinner recipes this week"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  className="border-pc-tan/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newListName.trim()) {
                      e.preventDefault();
                      handleCreateList();
                    }
                  }}
                />
              </div>
              <PremiumButton
                type="submit"
                size="lg"
                color="olive"
                className="w-full"
                disabled={createListMutation.isPending || !newListName.trim()}
              >
                {createListMutation.isPending ? 'Creating...' : 'Create List'}
              </PremiumButton>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lists Sidebar */}
        <GlassCard glow={false} className="lg:col-span-1">
          <SectionHeader
            icon={ShoppingCart}
            title={`My Lists (${shoppingLists?.length || 0})`}
          />
          <div className="mt-6">
            {listsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : shoppingLists && shoppingLists.length > 0 ? (
              <div className="space-y-3">
                {shoppingLists.map((list) => (
                  <div
                    key={list.id}
                    className={cn(
                      "w-full rounded-xl border-2 transition-all duration-200 relative group",
                      selectedListId === list.id
                        ? 'border-pc-navy bg-gradient-to-r from-pc-navy to-pc-navy/90 text-pc-white shadow-lg'
                        : 'border-pc-tan/40 hover:bg-pc-tan/20 hover:border-pc-olive/40 text-pc-navy'
                    )}
                  >
                    <button
                      onClick={() => setSelectedListId(list.id)}
                      className="w-full text-left p-4 pr-12"
                    >
                      <h3 className="font-bold text-lg">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm mt-1 opacity-80">{list.description}</p>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingListId(list.id);
                        setRenameListName(list.name);
                        setIsRenameDialogOpen(true);
                      }}
                      className={cn(
                        "absolute top-2 right-2 p-1.5 rounded-md transition-colors",
                        selectedListId === list.id
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-pc-tan/30 text-pc-navy opacity-0 group-hover:opacity-100'
                      )}
                      aria-label="Rename list"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-2xl opacity-50" />
                  <div className="relative bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 p-8 rounded-full">
                    <ShoppingCart className="h-16 w-16 text-pc-tan mx-auto" />
                  </div>
                </div>
                <p className="text-pc-text-light font-medium mb-6">No lists yet</p>
                <PremiumButton
                  onClick={() => setIsCreateDialogOpen(true)}
                  color="olive"
                >
                  Create Your First List
                </PremiumButton>
              </div>
            )}
          </div>
        </GlassCard>

        {/* List Details */}
        <GlassCard glow={false} className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <GradientText className="text-2xl font-bold">{selectedList?.name || 'Select a List'}</GradientText>
                {selectedList && (
                  <button
                    onClick={() => {
                      setRenamingListId(selectedList.id);
                      setRenameListName(selectedList.name);
                      setIsRenameDialogOpen(true);
                    }}
                    className="p-1.5 rounded-md hover:bg-pc-tan/20 text-pc-navy transition-colors"
                    aria-label="Rename list"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {selectedList && (
                <p className="text-base text-pc-text-light mt-1 font-medium">
                  {checkedCount} of {totalCount} items checked
                </p>
              )}
            </div>
            {selectedListId && (
              <div className="flex gap-2 flex-wrap">
                <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                  <DialogTrigger asChild>
                    <PremiumButton size="lg" color="olive">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </PremiumButton>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Item to List</DialogTitle>
                      <DialogDescription>
                        Add an ingredient to your shopping list
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ingredientSearch">Search Ingredient</Label>
                        <div className="relative mt-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pc-text-light" />
                          <Input
                            id="ingredientSearch"
                            placeholder="Search ingredients..."
                            value={ingredientSearch}
                            onChange={(e) => setIngredientSearch(e.target.value)}
                            className="pl-10 border-pc-tan/20"
                          />
                        </div>
                        {ingredientsLoading ? (
                          <div className="mt-2 space-y-2">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-10 w-full rounded-lg" />
                            ))}
                          </div>
                        ) : !allIngredients || allIngredients.length === 0 ? (
                          <p className="mt-2 text-sm text-pc-text-light">No ingredients available. Please add ingredients first.</p>
                        ) : filteredIngredients.length > 0 ? (
                          <div className="mt-2 max-h-48 overflow-y-auto border border-pc-tan/20 rounded-lg">
                            {filteredIngredients.slice(0, 10).map((ingredient) => (
                              <button
                                key={ingredient.id}
                                onClick={() => {
                                  setAddItemIngredientId(ingredient.id);
                                  setIngredientSearch(ingredient.name);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 hover:bg-pc-tan/20 transition-colors",
                                  addItemIngredientId === ingredient.id && "bg-pc-navy text-pc-white"
                                )}
                              >
                                {ingredient.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-pc-text-light">No ingredients match your search.</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="addQuantity">Quantity</Label>
                          <Input
                            id="addQuantity"
                            placeholder="e.g., 2"
                            value={addItemQuantity}
                            onChange={(e) => setAddItemQuantity(e.target.value)}
                            className="border-pc-tan/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="addUnit">Unit</Label>
                          <Input
                            id="addUnit"
                            placeholder="e.g., cups"
                            value={addItemUnit}
                            onChange={(e) => setAddItemUnit(e.target.value)}
                            className="border-pc-tan/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {addItemIngredientId && (
                          <p className="text-sm text-pc-text-light">
                            Selected: {allIngredients?.find(i => i.id === addItemIngredientId)?.name || 'Unknown'}
                          </p>
                        )}
                        <PremiumButton
                          size="lg"
                          color="olive"
                          className="w-full"
                          onClick={handleAddItem}
                          disabled={addItemMutation.isPending || !addItemIngredientId}
                        >
                          {addItemMutation.isPending ? 'Adding...' : 'Add to List'}
                        </PremiumButton>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Select onValueChange={(value) => handleExport(value as any)}>
                  <SelectTrigger className="w-36 bg-pc-tan/20 border-pc-tan/40 hover:bg-pc-tan/30">
                    <Download className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">📕 PDF (.pdf)</SelectItem>
                    <SelectItem value="txt">📄 Text (.txt)</SelectItem>
                    <SelectItem value="csv">📊 CSV (.csv)</SelectItem>
                    <SelectItem value="md">📝 Markdown (.md)</SelectItem>
                    <SelectItem value="json">💾 JSON (.json)</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => handleSendToStore(value as GroceryStore)}>
                  <SelectTrigger className="w-44 bg-pc-olive/20 border-pc-olive/40 hover:bg-pc-olive/30">
                    <Store className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Send to Store" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllStores().map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.icon} {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <PremiumButton
                  onClick={() => {
                    if (selectedListId && confirm('Are you sure you want to delete this list?')) {
                      deleteListMutation.mutate({ id: selectedListId });
                    }
                  }}
                  disabled={deleteListMutation.isPending}
                  size="lg"
                  className="gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </PremiumButton>
              </div>
            )}
          </div>
          <div>
            {selectedListLoading || itemsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !selectedListId ? (
              <div className="text-center py-20">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-3xl opacity-60" />
                  <div className="relative bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 p-10 rounded-full">
                    <ShoppingCart className="h-20 w-20 text-pc-tan mx-auto" />
                  </div>
                </div>
                <GradientText className="text-2xl font-bold">Select a shopping list to view items</GradientText>
              </div>
            ) : listItems && listItems.length > 0 ? (
              <div className="space-y-2">
                {listItems.map((item) => {
                  const ingredient = allIngredients?.find(i => i.id === item.ingredientId);
                  if (!ingredient) return null;

                  const quantityDisplay = [item.quantity, item.unit].filter(Boolean).join(' ');

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border border-pc-tan/20 rounded-lg hover:bg-pc-tan/10"
                    >
                      <Checkbox
                        checked={item.isChecked || false}
                        onCheckedChange={(checked) => {
                          toggleItemMutation.mutate({
                            itemId: item.id,
                            isChecked: checked as boolean,
                          });
                        }}
                      />
                      {ingredient.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-pc-tan/20 flex-shrink-0 relative">
                          <img 
                            src={ingredient.imageUrl} 
                            alt={ingredient.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.ingredient-icon-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }
                            }}
                          />
                          {(() => {
                            const Icon = getIngredientIcon(ingredient);
                            return (
                              <div className="absolute inset-0 bg-pc-tan/40 flex items-center justify-center ingredient-icon-fallback" style={{ display: 'none' }}>
                                <Icon className="h-4 w-4 text-pc-olive" />
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        (() => {
                          const Icon = getIngredientIcon(ingredient);
                          return (
                            <div className="bg-pc-tan/40 p-2 rounded-lg flex-shrink-0">
                              <Icon className="h-4 w-4 text-pc-olive" />
                            </div>
                          );
                        })()
                      )}
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium",
                          item.isChecked ? 'line-through text-pc-text-light' : 'text-pc-navy'
                        )}>
                          {ingredient.name}
                        </p>
                        {quantityDisplay && (
                          <p className="text-sm text-pc-text-light">{quantityDisplay}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItemMutation.mutate({ itemId: item.id })}
                        disabled={removeItemMutation.isPending}
                        className="p-2 rounded-lg hover:bg-pc-tan/30 transition text-red-600"
                        aria-label={`Remove ${ingredient.name} from shopping list`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-3xl opacity-60" />
                  <div className="relative bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 p-10 rounded-full">
                    <ShoppingCart className="h-20 w-20 text-pc-tan mx-auto" />
                  </div>
                </div>
                <GradientText className="text-2xl font-bold mb-3">No items in this list</GradientText>
                <p className="text-pc-text-light text-lg">Add items from your recipes</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Rename List Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pc-navy flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-pc-olive" />
              Rename Shopping List
            </DialogTitle>
            <DialogDescription>
              Enter a new name for your shopping list
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!renamingListId || !renameListName.trim()) {
                toast.error('Please enter a list name');
                return;
              }
              updateListMutation.mutate({
                id: renamingListId,
                name: renameListName.trim(),
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="renameListName">List Name</Label>
              <Input
                id="renameListName"
                value={renameListName}
                onChange={(e) => setRenameListName(e.target.value)}
                placeholder="Enter list name"
                className="border-pc-tan/20 mt-2"
                autoFocus
                disabled={updateListMutation.isPending}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <PCButton
                type="button"
                onClick={() => {
                  setIsRenameDialogOpen(false);
                  setRenamingListId(null);
                  setRenameListName('');
                }}
                disabled={updateListMutation.isPending}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancel
              </PCButton>
              <PCButton
                type="submit"
                color="olive"
                disabled={updateListMutation.isPending || !renameListName.trim()}
              >
                {updateListMutation.isPending ? 'Renaming...' : 'Rename'}
              </PCButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

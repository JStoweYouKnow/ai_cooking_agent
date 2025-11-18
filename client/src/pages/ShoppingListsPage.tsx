import { useState } from 'react';
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Trash2, Download, Check, Search } from 'lucide-react';
import { getIngredientIcon } from '@/lib/ingredientIcons';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ShoppingListsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [addItemIngredientId, setAddItemIngredientId] = useState<number | null>(null);
  const [addItemQuantity, setAddItemQuantity] = useState('');
  const [addItemUnit, setAddItemUnit] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');

  const utils = trpc.useUtils();
  const { data: shoppingLists } = trpc.shoppingLists.list.useQuery();
  const { data: selectedList } = trpc.shoppingLists.getById.useQuery(
    { id: selectedListId! },
    { enabled: !!selectedListId }
  );
  const { data: listItems } = trpc.shoppingLists.getItems.useQuery(
    { id: selectedListId! },
    { enabled: !!selectedListId }
  );
  const { data: allIngredients } = trpc.ingredients.list.useQuery();

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
    if (!newListName.trim()) {
      toast.error('Please enter a list name');
      return;
    }
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
    if (!addItemIngredientId) {
      toast.error('Please select an ingredient');
      return;
    }
    
    const payload = {
      shoppingListId: selectedListId,
      ingredientId: addItemIngredientId,
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
    } catch (error: any) {
      // Error is already handled by onError in the mutation
      // Don't close dialog on error so user can try again
    }
  };

  const filteredIngredients = allIngredients?.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  ) || [];

  const handleExport = async (format: 'csv' | 'txt' | 'md' | 'json') => {
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
      const blob = new Blob([result.content], { type: result.mimeType });
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

  const checkedCount = listItems?.filter(item => item.isChecked).length || 0;
  const totalCount = listItems?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pc-navy">Shopping Lists</h1>
          <p className="mt-2 text-pc-text-light">
            Create and manage your shopping lists
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <PCButton className="gap-2">
              <Plus className="h-4 w-4" />
              New List
            </PCButton>
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
                  onChange={(e) => setNewListName(e.target.value)}
                  className="border-pc-tan/20"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newListName.trim()) {
                      e.preventDefault();
                      handleCreateList();
                    }
                  }}
                />
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
              <PCButton
                type="submit"
                className="w-full"
                disabled={createListMutation.isPending || !newListName.trim()}
              >
                {createListMutation.isPending ? 'Creating...' : 'Create List'}
              </PCButton>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lists Sidebar */}
        <PCCard className="lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-pc-navy">My Lists ({shoppingLists?.length || 0})</h2>
          </div>
          <div>
            {shoppingLists && shoppingLists.length > 0 ? (
              <div className="space-y-2">
                {shoppingLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      selectedListId === list.id
                        ? 'border-pc-navy bg-pc-navy text-pc-white'
                        : 'border-pc-tan/40 hover:bg-pc-tan/20 text-pc-navy'
                    )}
                  >
                    <h3 className="font-semibold">{list.name}</h3>
                    {list.description && (
                      <p className="text-sm mt-1 opacity-80">{list.description}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-pc-tan mx-auto mb-4" />
                <p className="text-pc-text-light">No lists yet</p>
                <PCButton
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                >
                  Create Your First List
                </PCButton>
              </div>
            )}
          </div>
        </PCCard>

        {/* List Details */}
        <PCCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-pc-navy">{selectedList?.name || 'Select a List'}</h2>
              {selectedList && (
                <p className="text-sm text-pc-text-light">
                  {checkedCount} of {totalCount} items checked
                </p>
              )}
            </div>
            {selectedListId && (
              <div className="flex gap-2">
                <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                  <DialogTrigger asChild>
                    <PCButton className="gap-2 bg-pc-olive hover:bg-pc-olive/90">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </PCButton>
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
                        {!allIngredients || allIngredients.length === 0 ? (
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
                        <PCButton
                          className="w-full"
                          onClick={handleAddItem}
                          disabled={addItemMutation.isPending || !addItemIngredientId}
                        >
                          {addItemMutation.isPending ? 'Adding...' : 'Add to List'}
                        </PCButton>
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
                    <SelectItem value="txt">📄 Text (.txt)</SelectItem>
                    <SelectItem value="csv">📊 CSV (.csv)</SelectItem>
                    <SelectItem value="md">📝 Markdown (.md)</SelectItem>
                    <SelectItem value="json">💾 JSON (.json)</SelectItem>
                  </SelectContent>
                </Select>
                <PCButton
                  onClick={() => {
                    if (selectedListId && confirm('Are you sure you want to delete this list?')) {
                      deleteListMutation.mutate({ id: selectedListId });
                    }
                  }}
                  disabled={deleteListMutation.isPending}
                  className="gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </PCButton>
              </div>
            )}
          </div>
          <div>
            {!selectedListId ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-pc-tan mx-auto mb-4" />
                <p className="text-pc-text-light">Select a shopping list to view items</p>
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-pc-tan mx-auto mb-4" />
                <p className="text-pc-text-light">No items in this list</p>
                <p className="text-sm text-pc-text-light mt-2">Add items from your recipes</p>
              </div>
            )}
          </div>
        </PCCard>
      </div>
    </div>
  );
}

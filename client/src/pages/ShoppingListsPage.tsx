import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Trash2, Download, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function ShoppingListsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

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
    onSuccess: (data) => {
      utils.shoppingLists.list.invalidate();
      setNewListName('');
      setNewListDescription('');
      setIsCreateDialogOpen(false);
      toast.success('Shopping list created');
      setSelectedListId(data.insertId as number);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteListMutation = trpc.shoppingLists.delete.useMutation({
    onSuccess: () => {
      utils.shoppingLists.list.invalidate();
      setSelectedListId(null);
      toast.success('Shopping list deleted');
    },
  });

  const toggleItemMutation = trpc.shoppingLists.toggleItem.useMutation({
    onSuccess: () => {
      utils.shoppingLists.getItems.invalidate();
    },
  });

  const removeItemMutation = trpc.shoppingLists.removeItem.useMutation({
    onSuccess: () => {
      utils.shoppingLists.getItems.invalidate();
      toast.success('Item removed');
    },
  });

  const exportListMutation = trpc.shoppingLists.export.useQuery(
    { id: selectedListId!, format: 'txt' as const },
    { enabled: false }
  );

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

  const handleExport = async (format: 'csv' | 'txt' | 'md' | 'json') => {
    if (!selectedListId) return;

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
    } catch (error) {
      toast.error('Failed to export list');
    }
  };

  const checkedCount = listItems?.filter(item => item.isChecked).length || 0;
  const totalCount = listItems?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Lists</h1>
          <p className="mt-2 text-gray-600">
            Create and manage your shopping lists
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shopping List</DialogTitle>
              <DialogDescription>
                Create a new shopping list for your grocery trips
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="listName">List Name *</Label>
                <Input
                  id="listName"
                  placeholder="e.g., Weekly Groceries"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="listDescription">Description (optional)</Label>
                <Input
                  id="listDescription"
                  placeholder="e.g., For dinner recipes this week"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateList}
                disabled={createListMutation.isPending}
              >
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lists Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Lists ({shoppingLists?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {shoppingLists && shoppingLists.length > 0 ? (
              <div className="space-y-2">
                {shoppingLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedListId === list.id
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{list.name}</h3>
                    {list.description && (
                      <p className="text-sm text-gray-600 mt-1">{list.description}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No lists yet</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="sm"
                  className="mt-4"
                >
                  Create Your First List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* List Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedList?.name || 'Select a List'}</CardTitle>
                {selectedList && (
                  <CardDescription>
                    {checkedCount} of {totalCount} items checked
                  </CardDescription>
                )}
              </div>
              {selectedListId && (
                <div className="flex gap-2">
                  <Select onValueChange={(value) => handleExport(value as any)}>
                    <SelectTrigger className="w-36 bg-orange-50 border-orange-200 hover:bg-orange-100">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="txt">📄 Text (.txt)</SelectItem>
                      <SelectItem value="csv">📊 CSV (.csv)</SelectItem>
                      <SelectItem value="md">📝 Markdown (.md)</SelectItem>
                      <SelectItem value="json">💾 JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => selectedListId && deleteListMutation.mutate({ id: selectedListId })}
                    disabled={deleteListMutation.isPending}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedListId ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a shopping list to view items</p>
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
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
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
                      <div className="flex-1">
                        <p className={`font-medium ${item.isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {ingredient.name}
                        </p>
                        {quantityDisplay && (
                          <p className="text-sm text-gray-600">{quantityDisplay}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemMutation.mutate({ itemId: item.id })}
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No items in this list</p>
                <p className="text-sm text-gray-500 mt-2">Add items from your recipes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Star, Clock, Users, ChefHat, ShoppingCart,
  Trash2, ExternalLink, Plus
} from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RecipeDetailPage() {
  const [, params] = useRoute('/recipes/:id');
  const recipeId = params?.id ? parseInt(params.id) : null;
  const [isAddToListDialogOpen, setIsAddToListDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');

  const utils = trpc.useUtils();
  const { data: recipe, isLoading } = trpc.recipes.getById.useQuery(
    { id: recipeId! },
    { enabled: !!recipeId }
  );
  const { data: recipeIngredients } = trpc.recipes.getRecipeIngredients.useQuery(
    { recipeId: recipeId! },
    { enabled: !!recipeId }
  );
  const { data: allIngredients } = trpc.ingredients.list.useQuery();
  const { data: shoppingLists } = trpc.shoppingLists.list.useQuery();

  const toggleFavoriteMutation = trpc.recipes.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.recipes.getById.invalidate();
      utils.recipes.list.invalidate();
      toast.success(recipe?.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    },
  });

  const addToShoppingListMutation = trpc.shoppingLists.addFromRecipe.useMutation({
    onSuccess: () => {
      toast.success('Ingredients added to shopping list');
      setIsAddToListDialogOpen(false);
      setSelectedListId('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createListMutation = trpc.shoppingLists.create.useMutation({
    onSuccess: (data) => {
      utils.shoppingLists.list.invalidate();
      const newListId = (data as any).insertId;
      if (recipeId && newListId) {
        addToShoppingListMutation.mutate({
          shoppingListId: newListId,
          recipeId,
        });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipe Not Found</h2>
        <p className="text-gray-600 mb-6">The recipe you're looking for doesn't exist.</p>
        <Link href="/recipes">
          <Button>Browse Recipes</Button>
        </Link>
      </div>
    );
  }

  const handleAddToList = () => {
    if (!selectedListId) {
      toast.error('Please select a shopping list');
      return;
    }
    addToShoppingListMutation.mutate({
      shoppingListId: parseInt(selectedListId),
      recipeId: recipeId!,
    });
  };

  const handleCreateNewList = () => {
    const listName = `Shopping list for ${recipe.name}`;
    createListMutation.mutate({ name: listName });
  };

  const ingredientsWithDetails = recipeIngredients?.map((ri: any) => {
    const ingredient = allIngredients?.find(i => i.id === ri.ingredientId);
    return {
      ...ri,
      ingredientName: ingredient?.name || 'Unknown',
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/recipes">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Recipes
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{recipe.name}</h1>
          {recipe.description && (
            <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {recipe.cuisine && (
              <Badge variant="secondary" className="gap-1">
                <ChefHat className="h-3 w-3" />
                {recipe.cuisine}
              </Badge>
            )}
            {recipe.category && <Badge variant="outline">{recipe.category}</Badge>}
            {recipe.source && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {recipe.source}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={recipe.isFavorite ? 'default' : 'outline'}
            size="icon"
            onClick={() =>
              toggleFavoriteMutation.mutate({
                id: recipe.id,
                isFavorite: !recipe.isFavorite,
              })
            }
            disabled={toggleFavoriteMutation.isPending}
          >
            <Star className={`h-4 w-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Recipe Image */}
      {recipe.imageUrl && (
        <Card className="overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-96 object-cover"
          />
        </Card>
      )}

      {/* Meta Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recipe.cookingTime && (
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cooking Time</p>
                  <p className="font-semibold text-gray-900">{recipe.cookingTime} min</p>
                </div>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Servings</p>
                  <p className="font-semibold text-gray-900">{recipe.servings}</p>
                </div>
              </div>
            )}
            {recipe.sourceUrl && (
              <div className="col-span-2">
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Original Recipe
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ingredients</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setIsAddToListDialogOpen(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to List
              </Button>
            </div>
            <CardDescription>
              {ingredientsWithDetails?.length || 0} items needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ingredientsWithDetails && ingredientsWithDetails.length > 0 ? (
              <ul className="space-y-3">
                {ingredientsWithDetails.map((item: any) => {
                  const quantityDisplay = [item.quantity, item.unit]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-1">•</span>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">
                          {item.ingredientName}
                        </span>
                        {quantityDisplay && (
                          <span className="text-gray-600 text-sm ml-2">
                            ({quantityDisplay})
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No ingredients listed</p>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Follow these steps to prepare the recipe</CardDescription>
          </CardHeader>
          <CardContent>
            {recipe.instructions ? (
              <div className="prose prose-sm max-w-none">
                {recipe.instructions.split('\n\n').map((step, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No instructions available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add to Shopping List Dialog */}
      <Dialog open={isAddToListDialogOpen} onOpenChange={setIsAddToListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Shopping List</DialogTitle>
            <DialogDescription>
              Add all ingredients from this recipe to a shopping list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {shoppingLists && shoppingLists.length > 0 ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select a list
                  </label>
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a shopping list" />
                    </SelectTrigger>
                    <SelectContent>
                      {shoppingLists.map((list) => (
                        <SelectItem key={list.id} value={list.id.toString()}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleAddToList}
                    disabled={addToShoppingListMutation.isPending}
                  >
                    Add to Selected List
                  </Button>
                </div>
                <Separator />
              </>
            ) : null}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCreateNewList}
              disabled={createListMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              Create New List for This Recipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

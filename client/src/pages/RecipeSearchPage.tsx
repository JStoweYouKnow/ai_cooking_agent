import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search, Star, ChefHat, Clock, Users, ExternalLink, Link2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Link from 'next/link';
import { RecipeCardSkeleton } from '@/components/RecipeCardSkeleton';

export default function RecipeSearchPage() {
  const [searchIngredients, setSearchIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [selectedSources, setSelectedSources] = useState<("TheMealDB" | "Epicurious" | "Delish" | "NYTCooking")[]>(["TheMealDB"]);

  const utils = trpc.useUtils();
  const { data: userIngredients } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: allIngredients } = trpc.ingredients.list.useQuery();
  const { data: savedRecipes } = trpc.recipes.list.useQuery();

  const searchRecipesMutation = trpc.recipes.searchByIngredients.useMutation();
  const getMealDetailsMutation = trpc.recipes.getTheMealDBDetails.useMutation();
  const importFromTheMealDBMutation = trpc.recipes.importFromTheMealDB.useMutation({
    onSuccess: () => {
      utils.recipes.list.invalidate();
      toast.success('Recipe saved to your collection');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const parseFromUrlMutation = trpc.recipes.parseFromUrl.useMutation({
    onSuccess: async (res) => {
      await utils.recipes.list.invalidate();
      if ('id' in res && res.id) {
        toast.success('Recipe imported from URL');
      } else {
        toast.success('Parsed recipe preview ready');
      }
      setImportUrl('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import recipe');
    },
  });

  const handleAddIngredient = () => {
    if (!currentIngredient.trim()) return;
    if (searchIngredients.length >= 5) {
      toast.error('Maximum 5 ingredients for search');
      return;
    }
    setSearchIngredients([...searchIngredients, currentIngredient.trim()]);
    setCurrentIngredient('');
  };

  const handleRemoveIngredient = (index: number) => {
    setSearchIngredients(searchIngredients.filter((_, i) => i !== index));
  };

  const handleSearch = () => {
    if (searchIngredients.length === 0) {
      toast.error('Add at least one ingredient to search');
      return;
    }
    searchRecipesMutation.mutate({ 
      ingredients: searchIngredients,
      sources: selectedSources.length > 0 ? selectedSources : undefined
    });
  };

  const handleUseMyIngredients = () => {
    const myIngredientNames = userIngredients
      ?.map(ui => allIngredients?.find(i => i.id === ui.ingredientId)?.name)
      .filter(Boolean)
      .slice(0, 5) as string[];

    if (!myIngredientNames || myIngredientNames.length === 0) {
      toast.error('No ingredients in your pantry. Add some first!');
      return;
    }

    setSearchIngredients(myIngredientNames);
    searchRecipesMutation.mutate({ ingredients: myIngredientNames });
  };

  const handleImportRecipe = (mealId: string) => {
    importFromTheMealDBMutation.mutate({ mealId });
  };

  const handleImportFromUrl = (autoSave: boolean) => {
    if (!importUrl.trim()) {
      toast.error('Enter a recipe URL');
      return;
    }
    parseFromUrlMutation.mutate({ url: importUrl.trim(), autoSave });
  };

  const isRecipeSaved = (mealId: string) => {
    return savedRecipes?.some(r => r.externalId === mealId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Find Recipes</h1>
        <p className="mt-2 text-gray-600">
          Search for recipes based on ingredients you have
        </p>
      </div>

      {/* Import From URL */}
      <Card>
        <CardHeader>
          <CardTitle>Import from URL</CardTitle>
          <CardDescription>
            Paste a recipe link. We’ll parse schema.org Recipe data or use AI as fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/your-favorite-recipe"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleImportFromUrl(true);
              }}
            />
            <Button
              onClick={() => handleImportFromUrl(true)}
              disabled={parseFromUrlMutation.isPending}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              {parseFromUrlMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50/50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-600" />
            Search by Ingredients
          </CardTitle>
          <CardDescription>
            Add up to 5 ingredients to discover recipes from multiple sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Recipe Sources</Label>
            <div className="flex flex-wrap gap-2">
              {(["TheMealDB", "Epicurious", "Delish", "NYTCooking"] as const).map((source) => (
                <Badge
                  key={source}
                  variant={selectedSources.includes(source) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-orange-100 transition-colors"
                  onClick={() => {
                    setSelectedSources(prev =>
                      prev.includes(source)
                        ? prev.filter(s => s !== source)
                        : [...prev, source]
                    );
                  }}
                >
                  {source === "TheMealDB" ? "TheMealDB" : source}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedSources.length === 0 && "Select at least one source to search"}
              {selectedSources.length > 0 && `Searching ${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''}`}
            </p>
          </div>
          
          {/* Ingredient Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter an ingredient (e.g., chicken)"
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
            />
            <Button onClick={handleAddIngredient} variant="outline">
              Add
            </Button>
            <Button onClick={handleUseMyIngredients} variant="outline" className="gap-2">
              <ChefHat className="h-4 w-4" />
              Use My Pantry
            </Button>
          </div>

          {/* Selected Ingredients */}
          {searchIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchIngredients.map((ingredient, index) => (
                <Badge key={index} variant="secondary" className="gap-2">
                  {ingredient}
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={searchRecipesMutation.isPending || searchIngredients.length === 0 || selectedSources.length === 0}
            className="w-full gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
            size="lg"
          >
            <Search className="h-4 w-4" />
            {searchRecipesMutation.isPending ? 'Searching...' : 'Search Recipes'}
          </Button>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchRecipesMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>
              Found {searchRecipesMutation.data.length} Recipes
            </CardTitle>
            <CardDescription>
              Recipes matching your ingredients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchRecipesMutation.isPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <RecipeCardSkeleton key={i} />
                ))}
              </div>
            ) : searchRecipesMutation.data.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-50" />
                  <div className="relative bg-gradient-to-br from-orange-100 to-orange-50 p-8 rounded-full">
                    <BookOpen className="h-20 w-20 text-orange-600 mx-auto" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No recipes found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find any recipes matching your ingredients. Try adding different ingredients or searching other sources.
                </p>
                <Button
                  onClick={() => {
                    setSearchIngredients([]);
                    setCurrentIngredient('');
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Start New Search
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchRecipesMutation.data.map((meal: any) => (
                  <Card key={meal.idMeal} className="hover:shadow-xl transition-all duration-200 border-orange-100 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={meal.strMealThumb}
                          alt={meal.strMeal}
                          className="w-full h-48 object-cover"
                        />
                        {meal.source && (
                          <Badge className="absolute top-2 right-2 bg-white/90 text-orange-700 border-orange-200">
                            {meal.source}
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">{meal.strMeal}</h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => setSelectedMealId(meal.idMeal)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleImportRecipe(meal.idMeal)}
                            disabled={isRecipeSaved(meal.idMeal) || importFromTheMealDBMutation.isPending}
                          >
                            {isRecipeSaved(meal.idMeal) ? 'Saved ✓' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Saved Recipes */}
      <Card>
        <CardHeader>
          <CardTitle>My Saved Recipes</CardTitle>
          <CardDescription>Recipes you've saved to your collection</CardDescription>
        </CardHeader>
        <CardContent>
          {savedRecipes && savedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedRecipes.map((recipe) => (
                <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                      {recipe.isFavorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {recipe.cuisine && (
                      <Badge variant="secondary" className="text-xs">{recipe.cuisine}</Badge>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      {recipe.cookingTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recipe.cookingTime}m
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-50" />
                <div className="relative bg-gradient-to-br from-orange-100 to-orange-50 p-8 rounded-full">
                  <Star className="h-20 w-20 text-orange-600 mx-auto" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No saved recipes yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start discovering amazing recipes! Search by ingredients and save your favorites here.
              </p>
              <Link href="/recipes">
                <Button className="gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg">
                  <Search className="h-5 w-5" />
                  Find Recipes
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

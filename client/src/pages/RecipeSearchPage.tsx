import { useState } from 'react';
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { RecipeCard, CookingBadge } from '@/components/cooking-theme';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BookOpen, Search, Star, ChefHat, Clock, Users, ExternalLink, Link2, UtensilsCrossed } from 'lucide-react';
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

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (searchIngredients.length === 0) {
      toast.error('Add at least one ingredient to search');
      return;
    }
    setIsSearching(true);
    try {
      const result = await utils.client.recipes.searchByIngredients.query({ 
        ingredients: searchIngredients,
        sources: selectedSources.length > 0 ? selectedSources : undefined
      });
      setSearchResults(result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to search recipes');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseMyIngredients = async () => {
    const myIngredientNames = userIngredients
      ?.map(ui => allIngredients?.find(i => i.id === ui.ingredientId)?.name)
      .filter(Boolean)
      .slice(0, 5) as string[];

    if (!myIngredientNames || myIngredientNames.length === 0) {
      toast.error('No ingredients in your pantry. Add some first!');
      return;
    }

    setSearchIngredients(myIngredientNames);
    setIsSearching(true);
    try {
      const result = await utils.client.recipes.searchByIngredients.query({ ingredients: myIngredientNames });
      setSearchResults(result);
    } catch (error: any) {
      toast.error(error.message || 'Failed to search recipes');
    } finally {
      setIsSearching(false);
    }
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
        <h1 className="text-3xl font-bold text-pc-navy">Find Recipes</h1>
        <p className="mt-2 text-pc-text-light">
          Search for recipes based on ingredients you have
        </p>
      </div>

      {/* Import From URL */}
      <PCCard>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-pc-navy">Import from URL</h2>
          <p className="text-sm text-pc-text-light">
            Paste a recipe link. We'll parse schema.org Recipe data or use AI as fallback.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/your-favorite-recipe"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleImportFromUrl(true);
              }}
              className="border-pc-tan/20"
            />
            <PCButton
              onClick={() => handleImportFromUrl(true)}
              disabled={parseFromUrlMutation.isPending}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              {parseFromUrlMutation.isPending ? 'Importing...' : 'Import'}
            </PCButton>
          </div>
        </div>
      </PCCard>

      {/* Search Section */}
      <PCCard className="border-2 border-pc-tan/40 bg-pc-tan/10">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-pc-navy flex items-center gap-2 mb-1">
            <ChefHat className="h-5 w-5 text-pc-olive" />
            Search by Ingredients
          </h2>
          <p className="text-sm text-pc-text-light">
            Add up to 5 ingredients to discover recipes from multiple sources
          </p>
        </div>
        <div className="space-y-4">
          {/* Source Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Recipe Sources</Label>
            <div className="flex flex-wrap gap-2">
              {(["TheMealDB", "Epicurious", "Delish", "NYTCooking"] as const).map((source) => (
                <Badge
                  key={source}
                  variant={selectedSources.includes(source) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedSources.includes(source)
                      ? "bg-pc-navy text-pc-white hover:bg-pc-navy/90"
                      : "border-pc-tan/40 hover:bg-pc-tan/20"
                  }`}
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
            <p className="text-xs text-pc-text-light mt-2">
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
              className="border-pc-tan/20"
            />
            <PCButton onClick={handleAddIngredient} className="bg-pc-olive hover:bg-pc-olive/90">
              Add
            </PCButton>
            <PCButton onClick={handleUseMyIngredients} className="bg-pc-olive hover:bg-pc-olive/90 gap-2">
              <ChefHat className="h-4 w-4" />
              Use My Pantry
            </PCButton>
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
          <PCButton
            onClick={handleSearch}
            disabled={isSearching || searchIngredients.length === 0 || selectedSources.length === 0}
            className="w-full gap-2 bg-pc-navy hover:bg-pc-navy/90"
          >
            <Search className="h-4 w-4" />
            {isSearching ? 'Searching...' : 'Search Recipes'}
          </PCButton>
        </div>
      </PCCard>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <PCCard>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-pc-navy">
              Found {searchResults.length} Recipes
            </h2>
            <p className="text-sm text-pc-text-light">
              Recipes matching your ingredients
            </p>
          </div>
          <div>
            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <RecipeCardSkeleton key={i} />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-2xl opacity-50" />
                  <div className="relative bg-pc-tan/20 p-8 rounded-full">
                    <BookOpen className="h-20 w-20 text-pc-olive mx-auto" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-pc-navy mb-2">No recipes found</h3>
                <p className="text-pc-text-light mb-6 max-w-md mx-auto">
                  We couldn't find any recipes matching your ingredients. Try adding different ingredients or searching other sources.
                </p>
                <PCButton
                  onClick={() => {
                    setSearchIngredients([]);
                    setCurrentIngredient('');
                  }}
                  className="gap-2 bg-pc-olive hover:bg-pc-olive/90"
                >
                  <Search className="h-4 w-4" />
                  Start New Search
                </PCButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((meal: any) => (
                  <RecipeCard
                    key={meal.idMeal}
                    recipe={{
                      id: meal.idMeal,
                      name: meal.strMeal,
                      imageUrl: meal.strMealThumb,
                      cuisine: meal.strArea,
                      category: meal.strCategory,
                      cookingTime: null,
                      servings: null,
                      isFavorite: savedRecipes?.some((r: any) => r.externalId === meal.idMeal && r.isFavorite),
                    }}
                    onClick={() => {
                      setSelectedMealId(meal.idMeal);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </PCCard>
      )}

      {/* Saved Recipes Section - Enhanced */}
      <PCCard className="bg-gradient-to-br from-pc-tan/10 to-pc-olive/5 border-pc-olive/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-pc-olive/10">
            <BookOpen className="h-5 w-5 text-pc-olive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-pc-navy">Your Recipe Collection</h2>
            <p className="text-sm text-pc-text-light">Saved recipes ready to cook</p>
          </div>
        </div>
        {savedRecipes && savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedRecipes.map((recipe: any) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  id: recipe.id,
                  name: recipe.name,
                  imageUrl: recipe.imageUrl,
                  cuisine: recipe.cuisine,
                  category: recipe.category,
                  cookingTime: recipe.cookingTime,
                  servings: recipe.servings,
                  isFavorite: recipe.isFavorite,
                }}
                onClick={() => {
                  // Navigate to recipe detail
                  window.location.href = `/recipes`;
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-2xl opacity-50" />
              <div className="relative bg-pc-tan/20 p-8 rounded-full">
                <ChefHat className="h-20 w-20 text-pc-olive mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-pc-navy mb-2">No saved recipes yet</h3>
            <p className="text-pc-text-light mb-6 max-w-md mx-auto">
              Start building your recipe collection by searching and saving your favorite dishes!
            </p>
          </div>
        )}
      </PCCard>

    </div>
  );
}

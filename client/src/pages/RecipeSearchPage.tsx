import { useState } from 'react';
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { RecipeCard, CookingBadge } from '@/components/cooking-theme';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BookOpen, Search, Star, ChefHat, Clock, Users, ExternalLink, Link2, UtensilsCrossed, Sparkles } from 'lucide-react';
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
    <div className="relative space-y-8 pb-16">
      {/* Background decorative elements */}
      <DecorativeBlob
        color="olive"
        position="top-right"
        size="lg"
        opacity={0.12}
      />
      <DecorativeBlob
        color="tan"
        position="bottom-left"
        size="md"
        opacity={0.08}
      />

      {/* Hero Header */}
      <GradientHero
        badge={
          <div className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recipe Discovery
          </div>
        }
        title="Find Your Next Favorite Recipe"
        subtitle="Powered by AI and curated sources"
        description="Search for recipes based on ingredients you have, or import from your favorite cooking websites. Discover delicious meals tailored to your pantry."
        compact
      />

      {/* Import From URL */}
      <GlassCard glow={false}>
        <SectionHeader
          icon={Link2}
          title="Import from URL"
          subtitle="Paste a recipe link. We'll parse schema.org Recipe data or use AI as fallback."
        />
        <div className="mt-6">
          <div className="flex gap-3">
            <Input
              placeholder="https://example.com/your-favorite-recipe"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleImportFromUrl(true);
              }}
              className="border-pc-tan/20 h-12 text-base"
            />
            <PremiumButton
              onClick={() => handleImportFromUrl(true)}
              disabled={parseFromUrlMutation.isPending}
              size="lg"
              color="navy"
            >
              <Link2 className="h-4 w-4" />
              {parseFromUrlMutation.isPending ? 'Importing...' : 'Import'}
            </PremiumButton>
          </div>
        </div>
      </GlassCard>

      {/* Search Section */}
      <div className="relative">
        <BackgroundPattern pattern="mesh" opacity={0.06} className="rounded-2xl" />
        <GlassCard glow className="relative z-10 border-2 border-pc-tan/30">
          <SectionHeader
            icon={ChefHat}
            title="Search by Ingredients"
            subtitle="Add up to 5 ingredients to discover recipes from multiple sources"
          />
          <div className="space-y-6 mt-6">
            {/* Source Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block text-pc-navy">Recipe Sources</Label>
              <div className="flex flex-wrap gap-2">
                {(["TheMealDB", "Epicurious", "Delish", "NYTCooking"] as const).map((source) => (
                  <Badge
                    key={source}
                    variant={selectedSources.includes(source) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 text-sm py-2 px-4 ${
                      selectedSources.includes(source)
                        ? "bg-gradient-to-r from-pc-navy to-pc-navy/90 text-white hover:shadow-lg"
                        : "border-pc-tan/40 hover:bg-pc-tan/20 hover:border-pc-olive/40"
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
              <p className="text-sm text-pc-text-light mt-3 font-medium">
                {selectedSources.length === 0 && "⚠️ Select at least one source to search"}
                {selectedSources.length > 0 && `✓ Searching ${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Ingredient Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter an ingredient (e.g., chicken)"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                className="border-pc-tan/20 h-12 text-base flex-1"
              />
              <PremiumButton onClick={handleAddIngredient} size="lg" color="olive">
                Add
              </PremiumButton>
              <PremiumButton onClick={handleUseMyIngredients} size="lg" color="olive" variant="outline">
                <ChefHat className="h-4 w-4" />
                Use My Pantry
              </PremiumButton>
            </div>

            {/* Selected Ingredients */}
            {searchIngredients.length > 0 && (
              <div className="flex flex-wrap gap-3 p-4 bg-gradient-to-r from-pc-olive/10 to-pc-tan/10 rounded-xl border border-pc-olive/20">
                {searchIngredients.map((ingredient, index) => (
                  <Badge key={index} className="gap-2 py-2 px-4 text-sm bg-white border border-pc-olive/30 text-pc-navy hover:bg-pc-olive/10">
                    {ingredient}
                    <button
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-pc-navy hover:text-red-600 font-bold text-lg"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Search Button */}
            <PremiumButton
              onClick={handleSearch}
              disabled={isSearching || searchIngredients.length === 0 || selectedSources.length === 0}
              size="lg"
              color="navy"
              className="w-full"
            >
              <Search className="h-5 w-5" />
              {isSearching ? 'Searching...' : 'Search Recipes'}
            </PremiumButton>
          </div>
        </GlassCard>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <GlassCard glow={false}>
          <SectionHeader
            icon={Search}
            title={`Found ${searchResults.length} Recipes`}
            subtitle="Recipes matching your ingredients"
          />
          <div className="mt-8">
            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <RecipeCardSkeleton key={i} />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-3xl opacity-60" />
                  <div className="relative bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 p-10 rounded-full">
                    <BookOpen className="h-24 w-24 text-pc-olive mx-auto" />
                  </div>
                </div>
                <GradientText className="text-3xl font-bold mb-4">No recipes found</GradientText>
                <p className="text-pc-text-light mb-8 max-w-md mx-auto text-lg">
                  We couldn't find any recipes matching your ingredients. Try adding different ingredients or searching other sources.
                </p>
                <PremiumButton
                  onClick={() => {
                    setSearchIngredients([]);
                    setCurrentIngredient('');
                  }}
                  size="lg"
                  color="olive"
                >
                  <Search className="h-4 w-4" />
                  Start New Search
                </PremiumButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </GlassCard>
      )}

      {/* Saved Recipes Section - Enhanced */}
      <div className="relative">
        <BackgroundPattern pattern="dots" opacity={0.05} className="rounded-2xl" />
        <GlassCard glow={false} className="relative z-10 border-2 border-pc-olive/20 bg-gradient-to-br from-pc-tan/10 to-pc-olive/5">
          <SectionHeader
            icon={BookOpen}
            title="Your Recipe Collection"
            subtitle="Saved recipes ready to cook"
          />
          <div className="mt-8">
            {savedRecipes && savedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="text-center py-16">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-3xl opacity-60" />
                  <div className="relative bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 p-10 rounded-full">
                    <ChefHat className="h-24 w-24 text-pc-olive mx-auto" />
                  </div>
                </div>
                <GradientText className="text-3xl font-bold mb-4">No saved recipes yet</GradientText>
                <p className="text-pc-text-light mb-8 max-w-md mx-auto text-lg">
                  Start building your recipe collection by searching and saving your favorite dishes!
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

    </div>
  );
}

import { useParams, useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Star, Clock, Users, ChefHat, ShoppingCart,
  ExternalLink, Plus, UtensilsCrossed, Play, BookOpen,
  ChevronLeft, ChevronRight, X, Trash2, Tag, Edit2, Check
} from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { CookingBadge, CookingTimeBadge, ServingsBadge, CaloriesBadge } from '@/components/cooking-theme';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params?.id ? parseInt(String(params.id)) : null;
  const [isAddToListDialogOpen, setIsAddToListDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');

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

  const deleteRecipeMutation = trpc.recipes.delete.useMutation({
    onSuccess: () => {
      utils.recipes.list.invalidate();
      toast.success('Recipe deleted successfully');
      router.push('/recipes' as any);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete recipe');
    },
  });

  const updateTagsMutation = trpc.recipes.updateTags.useMutation({
    onSuccess: () => {
      utils.recipes.getById.invalidate();
      toast.success('Tags updated');
      setIsEditingTags(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update tags');
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-pc-tan/30 rounded-xl w-1/4"></div>
          <div className="h-12 bg-pc-tan/30 rounded-xl w-2/3"></div>
          <div className="h-96 bg-gradient-to-br from-pc-tan/20 to-pc-olive/10 rounded-2xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-pc-tan/20 rounded-2xl"></div>
            <div className="lg:col-span-2 h-64 bg-pc-tan/20 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-2xl opacity-50" />
          <div className="relative bg-pc-tan/20 p-8 rounded-full">
            <ChefHat className="h-20 w-20 text-pc-olive mx-auto" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-pc-navy mb-2">Recipe Not Found</h2>
        <p className="text-pc-text-light mb-8 max-w-md mx-auto">
          The recipe you're looking for doesn't exist or may have been removed.
        </p>
        <Link href="/recipes">
          <PCButton className="gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Browse Recipes
          </PCButton>
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

  const handleDeleteRecipe = () => {
    if (recipeId) {
      deleteRecipeMutation.mutate({ id: recipeId });
    }
  };

  // Get ingredients from either the junction table OR the JSONB column
  const ingredientsWithDetails = (() => {
    // First try the junction table (for manually created recipes)
    if (recipeIngredients && recipeIngredients.length > 0) {
      return recipeIngredients.map((ri: any) => {
        const ingredient = allIngredients?.find(i => i.id === ri.ingredientId);
        return {
          ...ri,
          ingredientName: ingredient?.name || 'Unknown',
        };
      });
    }
    // Fall back to JSONB ingredients column (for imported recipes)
    const jsonbIngredients = (recipe as any)?.ingredients;
    if (jsonbIngredients && Array.isArray(jsonbIngredients)) {
      return jsonbIngredients.map((ing: any, idx: number) => ({
        id: idx,
        ingredientName: ing.raw || ing.ingredient || ing.name || String(ing),
        quantity: ing.quantity || ing.quantity_float || null,
        unit: ing.unit || null,
      }));
    }
    return [];
  })();

  // Parse recipe steps from instructions TEXT or steps JSONB
  const recipeSteps = (() => {
    // First try the instructions text field
    if (recipe?.instructions) {
      return recipe.instructions.split('\n').filter(Boolean).map((step) => {
        const isNumbered = /^\d+[\.\)]\s/.test(step.trim());
        return isNumbered ? step.trim() : step;
      });
    }
    // Fall back to JSONB steps column (for imported recipes)
    const jsonbSteps = (recipe as any)?.steps;
    if (jsonbSteps && Array.isArray(jsonbSteps)) {
      return jsonbSteps.map((step: string) => {
        if (typeof step === 'string') return step;
        return String(step);
      });
    }
    return [];
  })();

  const handleNextStep = () => {
    if (currentStep < recipeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartCookingMode = () => {
    setCurrentStep(0);
    setIsCookingMode(true);
  };

  const handleExitCookingMode = () => {
    setIsCookingMode(false);
    setCurrentStep(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Back Button */}
      <Link href="/recipes">
        <motion.button
          whileHover={{ x: -4 }}
          className="flex items-center gap-2 text-pc-navy hover:text-pc-olive transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Back to Recipes</span>
        </motion.button>
      </Link>

      {/* Header */}
      <PCCard className="border-2 border-pc-tan/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-pc-navy mb-3 leading-tight">{recipe.name}</h1>
            {recipe.description && (
              <p className="text-lg text-pc-text-light mb-4 leading-relaxed">{recipe.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {recipe.cuisine && (
                <CookingBadge variant="cuisine">
                  <ChefHat className="h-3 w-3" />
                  {recipe.cuisine}
                </CookingBadge>
              )}
              {recipe.category && (
                <CookingBadge variant="category">{recipe.category}</CookingBadge>
              )}
              {(recipe.cookingTime ?? 0) > 0 && <CookingTimeBadge minutes={recipe.cookingTime!} />}
              {(recipe.servings ?? 0) > 0 && <ServingsBadge count={recipe.servings!} />}
              {(recipe.caloriesPerServing ?? 0) > 0 && <CaloriesBadge calories={recipe.caloriesPerServing!} />}
              {recipe.source && (
                <CookingBadge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300">
                  {recipe.source}
                </CookingBadge>
              )}
            </div>

            {/* Tags Section */}
            <div className="mt-4 pt-4 border-t border-pc-tan/20">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-pc-olive" />
                <span className="text-sm font-medium text-pc-navy">Tags</span>
                <button
                  onClick={() => setIsEditingTags(!isEditingTags)}
                  className="ml-auto p-1 rounded hover:bg-pc-tan/20 transition-colors"
                >
                  {isEditingTags ? (
                    <Check className="h-4 w-4 text-pc-olive" />
                  ) : (
                    <Edit2 className="h-4 w-4 text-pc-text-light" />
                  )}
                </button>
              </div>
              
              {isEditingTags ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {((recipe as any).tags || []).map((tag: string, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="bg-pc-olive/10 text-pc-olive border-pc-olive/20 pr-1"
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const currentTags = (recipe as any).tags || [];
                            const newTags = currentTags.filter((_: string, i: number) => i !== idx);
                            updateTagsMutation.mutate({ id: recipe.id, tags: newTags });
                          }}
                          className="ml-1 p-0.5 rounded-full hover:bg-pc-olive/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          e.preventDefault();
                          const currentTags = (recipe as any).tags || [];
                          if (!currentTags.includes(newTag.trim())) {
                            updateTagsMutation.mutate({ 
                              id: recipe.id, 
                              tags: [...currentTags, newTag.trim()] 
                            });
                          }
                          setNewTag('');
                        }
                      }}
                    />
                    <PCButton
                      onClick={() => {
                        if (newTag.trim()) {
                          const currentTags = (recipe as any).tags || [];
                          if (!currentTags.includes(newTag.trim())) {
                            updateTagsMutation.mutate({ 
                              id: recipe.id, 
                              tags: [...currentTags, newTag.trim()] 
                            });
                          }
                          setNewTag('');
                        }
                      }}
                      disabled={!newTag.trim() || updateTagsMutation.isPending}
                      className="h-8 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </PCButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {((recipe as any).tags && (recipe as any).tags.length > 0) ? (
                    (recipe as any).tags.map((tag: string, idx: number) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="bg-pc-olive/10 text-pc-olive border-pc-olive/20"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-pc-text-light italic">
                      No tags yet. Click edit to add some.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                toggleFavoriteMutation.mutate({
                  id: recipe.id,
                  isFavorite: !recipe.isFavorite,
                })
              }
              disabled={toggleFavoriteMutation.isPending}
              className={`p-3 rounded-xl transition-all ${
                recipe.isFavorite
                  ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-600'
                  : 'bg-pc-tan/30 text-pc-text-light hover:bg-pc-tan/50'
              }`}
              aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`h-6 w-6 ${recipe.isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleteRecipeMutation.isPending}
              className="p-3 rounded-xl bg-pc-tan/30 text-pc-text-light hover:bg-red-100 hover:text-red-600 transition-all"
              aria-label="Delete recipe"
            >
              <Trash2 className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </PCCard>

      {/* Recipe Image */}
      {recipe.imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <PCCard className="overflow-hidden p-0">
            <div className="relative h-96 overflow-hidden group">
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </PCCard>
        </motion.div>
      )}

      {/* Meta Information */}
      {recipe.sourceUrl && (
        <PCCard className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Original Recipe</p>
                <p className="text-xs text-blue-500">View on external website</p>
              </div>
            </div>
            <motion.div whileHover={{ x: 4 }} className="text-blue-600">
              →
            </motion.div>
          </a>
        </PCCard>
      )}

      {/* Cooking Mode Toggle */}
      {recipeSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PCCard className="bg-gradient-to-r from-pc-olive/10 to-pc-navy/10 border-2 border-pc-olive/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-pc-olive/20">
                  <Play className="h-6 w-6 text-pc-olive" />
                </div>
                <div>
                  <h3 className="font-semibold text-pc-navy text-lg">Step-by-Step Cooking Mode</h3>
                  <p className="text-sm text-pc-text-light">
                    Follow along with interactive slides
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartCookingMode}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pc-olive to-pc-olive/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Start Cooking
              </motion.button>
            </div>
          </PCCard>
        </motion.div>
      )}

      {/* Cooking Mode Slide Viewer - Full Screen Overlay */}
      <AnimatePresence>
        {isCookingMode && recipeSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pc-olive/20">
                    <ChefHat className="h-6 w-6 text-pc-olive" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-xl">{recipe.name}</h2>
                    <p className="text-white/60 text-sm">
                      Step {currentStep + 1} of {recipeSteps.length}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleExitCookingMode}
                  className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Exit cooking mode"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-8">
                <motion.div
                  className="bg-gradient-to-r from-pc-olive to-pc-navy h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / recipeSteps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Slide Content */}
              <div className="flex-1 flex items-center justify-center mb-8 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pc-olive to-pc-navy text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
                          {currentStep + 1}
                        </div>
                        <h3 className="text-white/40 text-sm font-medium uppercase tracking-wider">
                          Current Step
                        </h3>
                      </div>
                      <p className="text-white text-2xl md:text-3xl lg:text-4xl leading-relaxed font-medium">
                        {recipeSteps[currentStep]}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`px-6 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                    currentStep === 0
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </motion.button>

                <div className="flex gap-2">
                  {recipeSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-pc-olive w-8'
                          : index < currentStep
                          ? 'bg-pc-olive/50'
                          : 'bg-white/20'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={currentStep === recipeSteps.length - 1 ? handleExitCookingMode : handleNextStep}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-pc-olive to-pc-navy text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  {currentStep === recipeSteps.length - 1 ? (
                    <>
                      Finish
                      <ChefHat className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </div>

              {/* Ingredients Quick Reference */}
              {ingredientsWithDetails && ingredientsWithDetails.length > 0 && (
                <div className="mt-6">
                  <details className="bg-white/5 rounded-xl border border-white/10">
                    <summary className="px-4 py-3 cursor-pointer text-white font-medium flex items-center gap-2 hover:bg-white/10 transition-colors rounded-xl">
                      <UtensilsCrossed className="h-4 w-4" />
                      Quick Ingredients Reference
                    </summary>
                    <div className="px-4 pb-4 pt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {ingredientsWithDetails.map((item: any) => {
                        const quantityDisplay = [item.quantity, item.unit]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <div key={item.id} className="text-white/80 text-sm">
                            <span className="font-medium">{item.ingredientName}</span>
                            {quantityDisplay && (
                              <span className="text-white/50 ml-1">({quantityDisplay})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients */}
        <PCCard className="lg:col-span-1 bg-gradient-to-br from-pc-tan/10 to-pc-olive/5">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pc-olive/10">
                  <UtensilsCrossed className="h-5 w-5 text-pc-olive" />
                </div>
                <h2 className="text-xl font-semibold text-pc-navy">Ingredients</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddToListDialogOpen(true)}
                className="p-2 rounded-lg bg-pc-navy text-white hover:bg-pc-navy/90 transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
              </motion.button>
            </div>
            <p className="text-sm text-pc-text-light">
              {ingredientsWithDetails?.length || 0} items needed
            </p>
          </div>

          {ingredientsWithDetails && ingredientsWithDetails.length > 0 ? (
            <div className="space-y-2">
              {ingredientsWithDetails.map((item: any, index: number) => {
                const quantityDisplay = [item.quantity, item.unit]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-pc-olive mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-pc-navy">
                        {item.ingredientName}
                      </p>
                      {quantityDisplay && (
                        <p className="text-sm text-pc-text-light">
                          {quantityDisplay}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <UtensilsCrossed className="h-12 w-12 text-pc-tan/40 mx-auto mb-2" />
              <p className="text-pc-text-light text-sm">No ingredients listed</p>
            </div>
          )}
        </PCCard>

        {/* Instructions */}
        <PCCard className="lg:col-span-2 bg-gradient-to-br from-white to-pc-tan/5">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-pc-navy/10">
                <ChefHat className="h-5 w-5 text-pc-navy" />
              </div>
              <h2 className="text-xl font-semibold text-pc-navy">Instructions</h2>
            </div>
            <p className="text-sm text-pc-text-light">
              Follow these steps to prepare the recipe
            </p>
          </div>

          {recipeSteps.length > 0 ? (
            <div className="space-y-4">
              {recipeSteps.map((step, index) => {
                // Remove leading step numbers if present (e.g., "1. " or "1) ")
                const stepText = step.replace(/^\d+[\.\)]\s*/, '').trim();

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-4 group"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pc-navy to-pc-olive text-white flex items-center justify-center font-semibold text-sm group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-pc-navy leading-relaxed whitespace-pre-wrap">
                        {stepText}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-pc-tan/40 mx-auto mb-3" />
              <p className="text-pc-text-light">No instructions available</p>
            </div>
          )}
        </PCCard>
      </div>

      {/* Add to Shopping List Dialog */}
      <Dialog open={isAddToListDialogOpen} onOpenChange={setIsAddToListDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pc-navy flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-pc-olive" />
              Add to Shopping List
            </DialogTitle>
            <DialogDescription>
              Add all ingredients from this recipe to a shopping list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {shoppingLists && shoppingLists.length > 0 ? (
              <>
                <div>
                  <label className="text-sm font-medium text-pc-navy mb-2 block">
                    Select a list
                  </label>
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger className="border-pc-tan/20 w-full">
                      <SelectValue placeholder="Choose a shopping list" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-xl max-h-[200px]">
                      {shoppingLists.map((list) => (
                        <SelectItem 
                          key={list.id} 
                          value={list.id.toString()}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <PCButton
                  className="w-full"
                  onClick={handleAddToList}
                  disabled={addToShoppingListMutation.isPending}
                >
                  {addToShoppingListMutation.isPending ? 'Adding...' : 'Add to Selected List'}
                </PCButton>
                <Separator />
              </>
            ) : null}
            <PCButton
              className="w-full gap-2 bg-pc-olive hover:bg-pc-olive/90"
              onClick={handleCreateNewList}
              disabled={createListMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              {createListMutation.isPending ? 'Creating...' : 'Create New List for This Recipe'}
            </PCButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pc-navy flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Recipe
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipe?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <PCButton
              className="flex-1"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteRecipeMutation.isPending}
            >
              Cancel
            </PCButton>
            <PCButton
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteRecipe}
              disabled={deleteRecipeMutation.isPending}
            >
              {deleteRecipeMutation.isPending ? 'Deleting...' : 'Delete'}
            </PCButton>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

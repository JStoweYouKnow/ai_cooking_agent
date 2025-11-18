"use client";
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { KitchenStatsCard, RecipeCard, CookingProgress } from '@/components/cooking-theme';
import { Apple, BookOpen, ShoppingCart, Star, TrendingUp, Plus, ChefHat, UtensilsCrossed, Flame } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

export default function Dashboard() {
  const { data: recipes, isLoading: recipesLoading } = trpc.recipes.list.useQuery();
  const { data: ingredients, isLoading: ingredientsLoading } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: shoppingLists, isLoading: listsLoading } = trpc.shoppingLists.list.useQuery();

  const favoriteRecipes = recipes?.filter(r => r.isFavorite) || [];
  const recentRecipes = recipes?.slice(0, 3) || [];

  const stats = [
    {
      name: 'My Ingredients',
      value: ingredients?.length || 0,
      icon: Apple,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/ingredients',
    },
    {
      name: 'Saved Recipes',
      value: recipes?.length || 0,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/recipes',
    },
    {
      name: 'Shopping Lists',
      value: shoppingLists?.length || 0,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/shopping-lists',
    },
    {
      name: 'Favorite Recipes',
      value: favoriteRecipes.length,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      href: '/recipes',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-pc-navy mb-4 tracking-tight">Welcome to Sous</h1>
        <p className="text-xl text-pc-text-light leading-relaxed max-w-2xl">
          Your kitchen companion for managing ingredients, discovering recipes, and planning meals.
        </p>
      </div>

      {/* Stats Grid - Cooking Themed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/ingredients">
          <KitchenStatsCard
            icon={Apple}
            label="My Pantry"
            value={ingredients?.length || 0}
            subtitle="Ingredients ready"
            color="pc-olive"
          />
        </Link>
        <Link href="/recipes">
          <KitchenStatsCard
            icon={BookOpen}
            label="Recipe Collection"
            value={recipes?.length || 0}
            subtitle="Saved recipes"
            color="pc-navy"
          />
        </Link>
        <Link href="/shopping-lists">
          <KitchenStatsCard
            icon={ShoppingCart}
            label="Shopping Lists"
            value={shoppingLists?.length || 0}
            subtitle="Active lists"
            color="pc-tan"
          />
        </Link>
        <Link href="/recipes">
          <KitchenStatsCard
            icon={Star}
            label="Favorites"
            value={favoriteRecipes.length}
            subtitle="Starred recipes"
            color="pc-olive"
          />
        </Link>
      </div>

      {/* Quick Actions - Cooking Themed */}
      <PCCard className="bg-gradient-to-br from-pc-tan/10 via-white to-pc-olive/5 border-pc-olive/20 shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-pc-olive/5 to-transparent opacity-50"></div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gradient-to-br from-pc-olive/20 to-pc-olive/10 shadow-sm">
              <ChefHat className="h-7 w-7 text-pc-olive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-pc-navy tracking-tight">Kitchen Quick Actions</h2>
              <p className="text-sm text-pc-text-light mt-1.5">Get cooking in seconds</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/ingredients">
              <PCButton className="w-full gap-2 bg-gradient-to-r from-pc-olive to-pc-olive/80 hover:from-pc-olive/90 hover:to-pc-olive shadow-lg">
                <Plus className="h-4 w-4" />
                Stock Pantry
              </PCButton>
            </Link>
            <Link href="/recipes">
              <PCButton className="w-full gap-2 bg-gradient-to-r from-pc-navy to-pc-navy/80 hover:from-pc-navy/90 hover:to-pc-navy shadow-lg">
                <BookOpen className="h-4 w-4" />
                Discover Recipes
              </PCButton>
            </Link>
            <Link href="/shopping-lists">
              <PCButton className="w-full gap-2 bg-gradient-to-r from-pc-tan to-pc-tan/80 hover:from-pc-tan/90 hover:to-pc-tan shadow-lg text-pc-navy">
                <ShoppingCart className="h-4 w-4" />
                Plan Shopping
              </PCButton>
            </Link>
          </div>
        </div>
      </PCCard>

      {/* Recent Recipes */}
      <PCCard>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-pc-navy tracking-tight">Recent Recipes</h2>
            <p className="text-sm text-pc-text-light mt-2">Your recently added recipes</p>
          </div>
          <Link href="/recipes">
            <button className="text-sm text-pc-olive hover:text-pc-navy font-medium">View All</button>
          </Link>
        </div>
        {recipesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pc-olive mx-auto mb-4"></div>
            <p className="text-pc-text-light">Loading recipes...</p>
          </div>
        ) : recentRecipes.length === 0 ? (
          <div className="text-center py-12 bg-pc-tan/5 rounded-lg border border-pc-tan/20">
            <BookOpen className="h-16 w-16 text-pc-tan mx-auto mb-4" />
            <p className="text-lg font-medium text-pc-navy mb-2">No recipes yet</p>
            <p className="text-pc-text-light mb-6">Start by finding amazing recipes to cook!</p>
            <Link href="/recipes">
              <PCButton className="gap-2 bg-pc-olive hover:bg-pc-olive/90 text-white">
                <BookOpen className="h-4 w-4" />
                Find Recipes
              </PCButton>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentRecipes.map((recipe) => (
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
                  // Navigate to recipe detail if needed
                  window.location.href = `/recipes`;
                }}
              />
            ))}
          </div>
        )}
      </PCCard>

      {/* Getting Started - Cooking Themed */}
      {(!recipes || recipes.length === 0) && (
        <PCCard className="bg-gradient-to-br from-pc-tan/20 via-pc-olive/5 to-pc-tan/20 border-pc-olive/30 relative overflow-hidden">
          {/* Decorative cooking elements */}
          <div className="absolute top-0 right-0 opacity-10">
            <UtensilsCrossed className="h-32 w-32 text-pc-olive" />
          </div>
          <div className="absolute bottom-0 left-0 opacity-10">
            <Flame className="h-24 w-24 text-pc-olive" />
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-pc-olive/10">
                <ChefHat className="h-6 w-6 text-pc-olive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-pc-navy">Welcome to Sous!</h2>
                <p className="text-sm text-pc-text-light">Let's get you cooking</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pc-olive/20 flex items-center justify-center text-pc-olive font-semibold text-sm">1</div>
                <p className="text-pc-text-light pt-0.5">Stock your pantry with ingredients you have on hand</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pc-olive/20 flex items-center justify-center text-pc-olive font-semibold text-sm">2</div>
                <p className="text-pc-text-light pt-0.5">Discover amazing recipes based on your ingredients</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pc-olive/20 flex items-center justify-center text-pc-olive font-semibold text-sm">3</div>
                <p className="text-pc-text-light pt-0.5">Save your favorite recipes for quick access</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pc-olive/20 flex items-center justify-center text-pc-olive font-semibold text-sm">4</div>
                <p className="text-pc-text-light pt-0.5">Create smart shopping lists for missing ingredients</p>
              </div>
            </div>
            
            <div className="mt-6">
              <Link href="/ingredients">
                <PCButton className="gap-2 bg-gradient-to-r from-pc-olive to-pc-olive/80 hover:from-pc-olive/90 hover:to-pc-olive shadow-lg">
                  <ChefHat className="h-4 w-4" />
                  Start Your Culinary Journey
                </PCButton>
              </Link>
            </div>
          </div>
        </PCCard>
      )}
    </div>
  );
}

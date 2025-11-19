"use client";
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { RecipeCard, CookingProgress } from '@/components/cooking-theme';
import { GlassCard } from '@/components/web3';
import { PageTransition } from '@/components/web3/PageTransition';
import {
  Apple,
  BookOpen,
  Bookmark,
  ShoppingCart,
  Plus,
  ChefHat,
  UtensilsCrossed,
  Flame,
  Sparkles,
  Leaf,
  TimerReset,
  AlarmClock,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

export default function Dashboard() {
  const { data: recipes, isLoading: recipesLoading } = trpc.recipes.list.useQuery();
  const { data: ingredients, isLoading: ingredientsLoading } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: shoppingLists, isLoading: listsLoading } = trpc.shoppingLists.list.useQuery();

  const favoriteRecipes = recipes?.filter(r => r.isFavorite) || [];
  const recentRecipes = recipes?.slice(0, 3) || [];
  const spotlightRecipe = recipes?.[0];

  const statHighlights = [
    {
      label: 'Pantry Restocked',
      value: `${ingredients?.length || 0} items`,
      trend: '+4 new',
      icon: Apple,
      accent: 'from-green-100 via-white to-green-50'
    },
    {
      label: 'Recipes Curated',
      value: `${recipes?.length || 0}`,
      trend: favoriteRecipes.length ? `${favoriteRecipes.length} favorites` : 'Add favorites',
      icon: BookOpen,
      accent: 'from-amber-100 via-white to-amber-50'
    },
    {
      label: 'Shopping Momentum',
      value: `${shoppingLists?.length || 0} lists`,
      trend: '2 reminders',
      icon: ShoppingCart,
      accent: 'from-purple-100 via-white to-purple-50'
    },
    {
      label: 'Chef Energy',
      value: '92%',
      trend: 'Focused & Inspired',
      icon: Sparkles,
      accent: 'from-pink-100 via-white to-pink-50'
    }
  ];

  const timelineEvents = [
    {
      time: '08:30 AM',
      title: 'Seasonal produce suggestion',
      detail: 'Fresh asparagus pairs with your salmon',
      badge: 'Suggestion'
    },
    {
      time: '12:15 PM',
      title: 'Pantry sync complete',
      detail: 'Added 3 new spices from photo import',
      badge: 'Pantry'
    },
    {
      time: '05:45 PM',
      title: 'Dinner playlist',
      detail: 'Mediterranean feast ready in 40m',
      badge: 'Dinner'
    }
  ];

  return (
    <PageTransition>
      <div className="space-y-8 pb-16">
      {/* Hero + Spotlight */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr,1fr]">
        <PCCard className="relative overflow-hidden bg-gradient-to-br from-pc-tan/40 via-white to-pc-olive/10 border-0 shadow-lg">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_hsla(36,60%,85%,0.7),_transparent_60%)]" />
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 text-sm text-pc-olive font-medium shadow">
                <Sparkles className="h-4 w-4" />
                Today’s Kitchen Mood
              </div>
              <h1 className="text-5xl font-bold text-pc-navy tracking-tight mt-4">Welcome to Sous</h1>
              <p className="text-lg text-pc-text-light mt-3 max-w-2xl">
                Discover vibrant recipes, keep your pantry in sync, and craft immersive cooking sessions with smart playlists.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PCButton className="bg-gradient-to-r from-pc-olive to-lime-600 hover:shadow-lg">
                <ChefHat className="h-4 w-4" />
                Explore Recipes
              </PCButton>
              <PCButton className="bg-white text-pc-navy border border-pc-tan/40 hover:bg-white/90">
                <ShoppingCart className="h-4 w-4 text-pc-navy" />
                Plan Shopping
              </PCButton>
              <PCButton className="bg-gradient-to-r from-pc-navy to-teal-700 hover:shadow-lg">
                <Plus className="h-4 w-4" />
                Stock Pantry
              </PCButton>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-pc-text-light">
              <div>
                <p className="text-pc-navy font-semibold text-lg">{ingredients?.length || 0}</p>
                <p>Pantry items ready</p>
              </div>
              <div>
                <p className="text-pc-navy font-semibold text-lg">{recipes?.length || 0}</p>
                <p>Recipes curated</p>
              </div>
              <div>
                <p className="text-pc-navy font-semibold text-lg">{shoppingLists?.length || 0}</p>
                <p>Shopping lists</p>
              </div>
            </div>
          </div>
        </PCCard>

        <PCCard className="bg-gradient-to-br from-pc-navy to-pc-olive text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_white,_transparent_60%)]" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-white/70">
              <Leaf className="h-4 w-4" />
              Featured Recipe
            </div>
            {spotlightRecipe ? (
              <>
                <h2 className="text-2xl font-semibold leading-tight">{spotlightRecipe.name}</h2>
                <p className="text-white/80 text-sm line-clamp-3">
                  {spotlightRecipe.description || 'Handpicked based on your pantry, ready to cook in under an hour.'}
                </p>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-white/70">
                  {spotlightRecipe.cuisine && <span>{spotlightRecipe.cuisine}</span>}
                  {spotlightRecipe.category && <span>• {spotlightRecipe.category}</span>}
                  {spotlightRecipe.cookingTime && <span>• {spotlightRecipe.cookingTime}m</span>}
                </div>
                <div className="flex gap-3">
                  <PCButton className="bg-white text-pc-navy hover:bg-white/90">
                    Start Cooking
                  </PCButton>
                  <PCButton className="bg-white/20 hover:bg-white/30 text-white border border-white/40">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </PCButton>
                </div>
              </>
            ) : (
              <div className="text-white/80">
                <p className="text-lg font-semibold">Add your first recipe</p>
                <p className="text-sm mt-1">Spotlight will highlight seasonal picks and favorite dishes.</p>
              </div>
            )}
          </div>
        </PCCard>
      </div>

      {/* Stats Ribbon */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-pc-navy">Today’s Kitchen Pulse</h2>
            <p className="text-sm text-pc-text-light">Live heartbeat of your cooking world</p>
          </div>
          <Link {...({ href: "/analytics" } as any)} className="text-sm text-pc-olive hover:text-pc-navy font-medium flex items-center gap-1">
            View insights <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-[680px]">
            {statHighlights.map((stat) => {
              const Icon = stat.icon;
              return (
                <GlassCard
                  key={stat.label}
                  hover
                  glow
                  gradient="primary"
                  className={`min-w-[220px] bg-gradient-to-br ${stat.accent} border-0`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-pc-text-light">{stat.label}</p>
                      <p className="text-2xl font-semibold text-pc-navy mt-2">{stat.value}</p>
                      <p className="text-sm text-pc-text-light">{stat.trend}</p>
                    </div>
                    <div className="p-3 rounded-full bg-white shadow">
                      <Icon className="h-5 w-5 text-pc-navy" />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <PCCard className="bg-white border border-pc-tan/30 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-pc-olive/10">
            <ChefHat className="h-6 w-6 text-pc-olive" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-pc-navy">Kitchen Quick Actions</h2>
            <p className="text-sm text-pc-text-light">Launchpad for your next culinary move</p>
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
                  isFavorite: recipe.isFavorite ?? undefined,
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

      {/* Timeline + Cooking Playlist */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <PCCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-pc-navy">Interactive Kitchen Timeline</h2>
              <p className="text-sm text-pc-text-light">Live feed of what Sous is orchestrating</p>
            </div>
            <button className="text-sm text-pc-olive hover:text-pc-navy font-medium">View full log</button>
          </div>
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={event.time} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-pc-text-light">{event.time}</span>
                  {index !== timelineEvents.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-pc-olive/40 to-transparent mt-2" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs tracking-wide uppercase text-pc-olive">{event.badge}</span>
                    <span className="w-2 h-2 rounded-full bg-pc-olive" />
                  </div>
                  <p className="text-pc-navy font-semibold">{event.title}</p>
                  <p className="text-sm text-pc-text-light">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </PCCard>

        <PCCard className="bg-gradient-to-br from-pc-navy to-pc-olive text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-white/20">
              <TimerReset className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Tonight’s Cooking Playlist</h2>
              <p className="text-sm text-white/70">Mediterranean feast · 4 steps</p>
            </div>
          </div>
          <div className="space-y-5">
            <CookingProgress currentStep={2} totalSteps={4} label="Progress" />
            <div className="space-y-3 text-sm">
              {[
                { label: 'Prep produce & marinade', duration: '12m' },
                { label: 'Sear salmon with herbs', duration: '18m' },
                { label: 'Toast saffron couscous', duration: '10m' },
                { label: 'Plating & garnish', duration: '5m' },
              ].map((step, idx) => (
                <div
                  key={step.label}
                  className={`flex items-center justify-between px-4 py-2 rounded-xl border ${
                    idx === 0 ? 'bg-white/15 border-white/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        idx === 0 ? 'bg-white text-pc-navy' : 'bg-white/20 text-white'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-white">{step.label}</span>
                  </div>
                  <span className="text-white/70">{step.duration}</span>
                </div>
              ))}
            </div>
            <PCButton className="bg-white text-pc-navy hover:bg-white/90 w-full">
              <AlarmClock className="h-4 w-4 text-pc-navy" />
              Send reminder to devices
            </PCButton>
          </div>
        </PCCard>
      </div>

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
    </PageTransition>
  );
}

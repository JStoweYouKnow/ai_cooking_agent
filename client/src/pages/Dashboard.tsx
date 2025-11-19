"use client";
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { RecipeCard, CookingProgress } from '@/components/cooking-theme';
import { GlassCard } from '@/components/web3';
import { PageTransition } from '@/components/web3/PageTransition';
import {
  GradientHero,
  StatCard,
  FeatureCard,
  SectionHeader,
  PremiumButton,
  DecorativeBlob,
  BackgroundPattern,
  GradientText
} from '@/components/premium-ui';
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
    <div className="relative space-y-8 pb-16">
      {/* Background decorative elements */}
      <DecorativeBlob
        color="olive"
        position="top-right"
        size="lg"
        opacity={0.15}
      />
      <DecorativeBlob
        color="tan"
        position="bottom-left"
        size="md"
        opacity={0.1}
      />

      {/* Hero + Spotlight */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr,1fr]">
        <GradientHero
          badge={
            <div className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Today's Kitchen Mood
            </div>
          }
          title="Welcome to Sous"
          subtitle="Your Personal Culinary Command Center"
          description="Discover vibrant recipes, keep your pantry in sync, and craft immersive cooking sessions with smart playlists."
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/recipes">
                <PremiumButton size="lg" color="olive">
                  <ChefHat className="h-4 w-4" />
                  Explore Recipes
                </PremiumButton>
              </Link>
              <Link href="/shopping-lists">
                <PremiumButton size="lg" variant="outline">
                  <ShoppingCart className="h-4 w-4" />
                  Plan Shopping
                </PremiumButton>
              </Link>
              <Link href="/ingredients">
                <PremiumButton size="lg" color="navy">
                  <Plus className="h-4 w-4" />
                  Stock Pantry
                </PremiumButton>
              </Link>
            </div>
          }
          stats={[
            { label: 'Pantry items ready', value: ingredients?.length || 0 },
            { label: 'Recipes curated', value: recipes?.length || 0 },
            { label: 'Shopping lists', value: shoppingLists?.length || 0 }
          ]}
        />

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pc-navy via-pc-navy/95 to-pc-olive text-white shadow-2xl">
          <BackgroundPattern pattern="dots" opacity={0.1} className="text-white" />
          <div className="relative z-10 p-8 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-white/70">
              <Leaf className="h-4 w-4" />
              Featured Recipe
            </div>
            {spotlightRecipe ? (
              <>
                <h2 className="text-3xl font-bold leading-tight tracking-tight">{spotlightRecipe.name}</h2>
                <p className="text-white/80 text-base line-clamp-3 leading-relaxed">
                  {spotlightRecipe.description || 'Handpicked based on your pantry, ready to cook in under an hour.'}
                </p>
                <div className="flex flex-wrap gap-3 text-sm uppercase tracking-wide text-white/70 font-medium">
                  {spotlightRecipe.cuisine && <span className="bg-white/10 px-3 py-1 rounded-full">{spotlightRecipe.cuisine}</span>}
                  {spotlightRecipe.category && <span className="bg-white/10 px-3 py-1 rounded-full">{spotlightRecipe.category}</span>}
                  {spotlightRecipe.cookingTime && <span className="bg-white/10 px-3 py-1 rounded-full">{spotlightRecipe.cookingTime}m</span>}
                </div>
                <div className="flex gap-3 pt-2">
                  <PremiumButton size="lg" className="bg-white text-pc-navy hover:bg-white/95">
                    <ChefHat className="h-4 w-4" />
                    Start Cooking
                  </PremiumButton>
                  <PremiumButton size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </PremiumButton>
                </div>
              </>
            ) : (
              <div className="text-white/80 py-8">
                <BookOpen className="h-12 w-12 text-white/60 mb-4" />
                <p className="text-xl font-semibold text-white">Add your first recipe</p>
                <p className="text-base mt-2">Spotlight will highlight seasonal picks and favorite dishes.</p>
                <Link href="/recipes" className="mt-4 inline-block">
                  <PremiumButton size="lg" className="bg-white text-pc-navy hover:bg-white/95">
                    <Plus className="h-4 w-4" />
                    Discover Recipes
                  </PremiumButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Ribbon */}
      <section className="space-y-4">
        <SectionHeader
          icon={Sparkles}
          title="Today's Kitchen Pulse"
          subtitle="Live heartbeat of your cooking world"
          action={
            <Link href="/analytics" className="text-sm text-pc-olive hover:text-pc-navy font-medium flex items-center gap-1 transition-colors">
              View insights <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-[680px]">
            {statHighlights.map((stat) => {
              const colorMap = {
                'from-green-100': 'olive',
                'from-amber-100': 'tan',
                'from-purple-100': 'purple',
                'from-pink-100': 'pink'
              };
              const color = (Object.keys(colorMap).find(key => stat.accent.includes(key))
                ? colorMap[Object.keys(colorMap).find(key => stat.accent.includes(key))!]
                : 'olive') as 'olive' | 'navy' | 'tan' | 'purple' | 'pink' | 'blue' | 'green';

              return (
                <StatCard
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  trend={stat.trend}
                  color={color}
                  className="min-w-[220px]"
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="relative">
        <BackgroundPattern pattern="mesh" opacity={0.05} className="rounded-2xl" />
        <GlassCard glow={false} className="relative z-10">
          <SectionHeader
            icon={ChefHat}
            title="Kitchen Quick Actions"
            subtitle="Launchpad for your next culinary move"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link href="/ingredients">
              <PremiumButton size="lg" color="olive" className="w-full">
                <Plus className="h-4 w-4" />
                Stock Pantry
              </PremiumButton>
            </Link>
            <Link href="/recipes">
              <PremiumButton size="lg" color="navy" className="w-full">
                <BookOpen className="h-4 w-4" />
                Discover Recipes
              </PremiumButton>
            </Link>
            <Link href="/shopping-lists">
              <PremiumButton size="lg" color="tan" className="w-full">
                <ShoppingCart className="h-4 w-4" />
                Plan Shopping
              </PremiumButton>
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Recent Recipes */}
      <GlassCard glow={false}>
        <SectionHeader
          icon={BookOpen}
          title="Recent Recipes"
          subtitle="Your recently added recipes"
          action={
            <Link href="/recipes">
              <button className="text-sm text-pc-olive hover:text-pc-navy font-medium transition-colors flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          }
        />
        <div className="mt-8">
          {recipesLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pc-olive mx-auto mb-4"></div>
              <p className="text-pc-text-light">Loading recipes...</p>
            </div>
          ) : recentRecipes.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-pc-tan/10 via-white to-pc-olive/5 rounded-xl border border-pc-tan/20">
              <BookOpen className="h-20 w-20 text-pc-tan/60 mx-auto mb-6" />
              <GradientText className="text-2xl font-bold mb-3">No recipes yet</GradientText>
              <p className="text-pc-text-light mb-8 text-lg">Start by finding amazing recipes to cook!</p>
              <Link href="/recipes">
                <PremiumButton size="lg" color="olive">
                  <BookOpen className="h-4 w-4" />
                  Find Recipes
                </PremiumButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      </GlassCard>

      {/* Timeline + Cooking Playlist */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <GlassCard glow={false}>
          <SectionHeader
            icon={AlarmClock}
            title="Interactive Kitchen Timeline"
            subtitle="Live feed of what Sous is orchestrating"
            action={
              <button className="text-sm text-pc-olive hover:text-pc-navy font-medium transition-colors">
                View full log
              </button>
            }
          />
          <div className="space-y-6 mt-8">
            {timelineEvents.map((event, index) => (
              <div key={event.time} className="flex gap-4">
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-xs font-bold text-pc-navy bg-pc-olive/10 px-2 py-1 rounded-md">{event.time}</span>
                  {index !== timelineEvents.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-pc-olive/60 via-pc-olive/30 to-transparent mt-3" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs tracking-wide uppercase text-white bg-pc-olive px-3 py-1 rounded-full font-semibold">
                      {event.badge}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-pc-olive animate-pulse" />
                  </div>
                  <p className="text-pc-navy font-bold text-lg mb-1">{event.title}</p>
                  <p className="text-base text-pc-text-light leading-relaxed">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pc-navy via-pc-navy/95 to-pc-olive text-white shadow-2xl">
          <BackgroundPattern pattern="grid" opacity={0.08} className="text-white" />
          <div className="relative z-10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <TimerReset className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Tonight's Cooking Playlist</h2>
                <p className="text-base text-white/80">Mediterranean feast · 4 steps</p>
              </div>
            </div>
            <div className="space-y-6">
              <CookingProgress currentStep={2} totalSteps={4} label="Progress" />
              <div className="space-y-3">
                {[
                  { label: 'Prep produce & marinade', duration: '12m' },
                  { label: 'Sear salmon with herbs', duration: '18m' },
                  { label: 'Toast saffron couscous', duration: '10m' },
                  { label: 'Plating & garnish', duration: '5m' },
                ].map((step, idx) => (
                  <div
                    key={step.label}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                      idx === 0
                        ? 'bg-white/20 border-white/40 shadow-lg'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                          idx === 0 ? 'bg-white text-pc-navy' : 'bg-white/20 text-white'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-white font-medium">{step.label}</span>
                    </div>
                    <span className="text-white/80 font-semibold">{step.duration}</span>
                  </div>
                ))}
              </div>
              <PremiumButton size="lg" className="bg-white text-pc-navy hover:bg-white/95 w-full">
                <AlarmClock className="h-4 w-4" />
                Send reminder to devices
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started - Cooking Themed */}
      {(!recipes || recipes.length === 0) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pc-tan/30 via-pc-olive/10 to-pc-tan/30 border-2 border-pc-olive/20 shadow-xl">
          <BackgroundPattern pattern="mesh" opacity={0.1} />
          {/* Decorative cooking elements */}
          <div className="absolute top-0 right-0 opacity-[0.08]">
            <UtensilsCrossed className="h-40 w-40 text-pc-olive" />
          </div>
          <div className="absolute bottom-0 left-0 opacity-[0.08]">
            <Flame className="h-32 w-32 text-pc-olive" />
          </div>

          <div className="relative p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pc-olive to-pc-olive/80 shadow-lg">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div>
                <GradientText className="text-3xl font-black mb-1">Welcome to Sous!</GradientText>
                <p className="text-base text-pc-text-light">Let's get you cooking</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                'Stock your pantry with ingredients you have on hand',
                'Discover amazing recipes based on your ingredients',
                'Save your favorite recipes for quick access',
                'Create smart shopping lists for missing ingredients'
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pc-olive to-pc-olive/80 flex items-center justify-center text-white font-bold text-base shadow-md">
                    {idx + 1}
                  </div>
                  <p className="text-pc-navy font-medium pt-1 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Link href="/ingredients">
                <PremiumButton size="lg" color="olive" className="shadow-xl">
                  <ChefHat className="h-5 w-5" />
                  Start Your Culinary Journey
                </PremiumButton>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}

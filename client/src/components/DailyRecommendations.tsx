"use client";
import { RecipeCard } from '@/components/cooking-theme';
import {
  GlassCard,
  SectionHeader,
  PremiumButton,
  GradientText
} from '@/components/premium-ui';
import { 
  Coffee, 
  UtensilsCrossed, 
  ChefHat, 
  IceCream,
  Sparkles,
  Calendar
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { RecipeCardSkeleton } from '@/components/RecipeCardSkeleton';

const categoryIcons = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: ChefHat,
  dessert: IceCream,
};

const categoryLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
};

const categoryColors: Record<keyof typeof categoryIcons, string> = {
  breakfast: 'bg-pc-tan/90',
  lunch: 'bg-pc-olive/90',
  dinner: 'bg-pc-navy/90',
  dessert: 'bg-pc-tan/90',
};

const seasonLabels: Record<string, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
};

export function DailyRecommendations() {
  const router = useRouter();
  const { data: recommendations, isLoading } = trpc.recipes.getDailyRecommendations.useQuery();

  if (isLoading) {
    return (
      <GlassCard glow={false}>
        <SectionHeader
          icon={Sparkles}
          title="Today's Recommendations"
          description="Seasonal recipes curated just for you"
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (!recommendations) {
    return null;
  }

  const { breakfast, lunch, dinner, dessert, season } = recommendations;
  const hasAnyRecommendations = breakfast || lunch || dinner || dessert;

  if (!hasAnyRecommendations) {
    return (
      <GlassCard glow={false}>
        <SectionHeader
          icon={Sparkles}
          title="Today's Recommendations"
          description="Seasonal recipes curated just for you"
        />
        <div className="mt-8 text-center py-12 bg-gradient-to-br from-pc-tan/10 via-white to-pc-olive/5 rounded-xl border border-pc-tan/20">
          <Calendar className="h-16 w-16 text-pc-tan/60 mx-auto mb-4" />
          <GradientText className="text-xl font-bold mb-2">No recommendations yet</GradientText>
          <p className="text-pc-text-light mb-6">
            Add some recipes to get personalized daily recommendations!
          </p>
        </div>
      </GlassCard>
    );
  }

  const categories = [
    { key: 'breakfast' as const, recipe: breakfast },
    { key: 'lunch' as const, recipe: lunch },
    { key: 'dinner' as const, recipe: dinner },
    { key: 'dessert' as const, recipe: dessert },
  ];

  return (
    <GlassCard glow={false}>
      <SectionHeader
        icon={Sparkles}
        title="Today's Recommendations"
        description={
          <div className="flex items-center gap-2">
            <span>Seasonal recipes curated for</span>
            <span className="font-semibold text-pc-olive capitalize">
              {seasonLabels[season] || season}
            </span>
          </div>
        }
      />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map(({ key, recipe }) => {
          const Icon = categoryIcons[key];
          const label = categoryLabels[key];
          const color = categoryColors[key];

          if (!recipe) {
            return (
              <div
                key={key}
                className="relative overflow-hidden rounded-xl border-2 border-dashed border-pc-tan/40 bg-gradient-to-br from-pc-tan/5 to-white p-8 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pc-tan/5 to-transparent opacity-50" />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pc-tan/20 mb-4">
                    <Icon className="h-8 w-8 text-pc-tan/60" />
                  </div>
                  <h3 className="font-bold text-lg text-pc-navy mb-2">{label}</h3>
                  <p className="text-sm text-pc-text-light">
                    No {label.toLowerCase()} recipe available
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pc-olive/20 to-pc-tan/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
              <div className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${color} backdrop-blur-sm text-white text-xs font-semibold shadow-lg`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </div>
                </div>
                <RecipeCard
                  recipe={{
                    id: recipe.id,
                    name: recipe.name,
                    imageUrl: recipe.imageUrl,
                    cuisine: recipe.cuisine,
                    category: recipe.category,
                    cookingTime: recipe.cookingTime,
                    servings: recipe.servings,
                    caloriesPerServing: recipe.caloriesPerServing ?? undefined,
                    isFavorite: recipe.isFavorite ?? undefined,
                  }}
                  onClick={() => {
                    router.push(`/recipes/${recipe.id}` as any);
                  }}
                  showDeleteButton={false}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/recipes/${recipe.id}` as any);
                    }
                  }}
                  aria-label={`View ${label.toLowerCase()} recipe: ${recipe.name}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}


/*
  Cooking-Themed UI Components
  Ultimate Kitchen Companion - Visual Elements
*/

"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ChefHat, Flame, Thermometer, Timer, UtensilsCrossed, Award, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PCCard } from '@/components/project-comfort-ui';

/* -------------------------------------------------------------------------- */
/* ------------------------- Cooking Badges & Tags ------------------------- */
/* -------------------------------------------------------------------------- */

export function CookingBadge({ 
  children, 
  variant = 'default',
  className 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'difficulty' | 'cuisine' | 'category' | 'time' | 'servings';
  className?: string;
}) {
  const variants = {
    default: 'bg-pc-tan/30 text-pc-navy border-pc-tan/50',
    difficulty: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300',
    cuisine: 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300',
    category: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
    time: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
    servings: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function DifficultyBadge({ level }: { level: 'Easy' | 'Medium' | 'Hard' | 'Expert' }) {
  const config = {
    Easy: { icon: Zap, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    Medium: { icon: ChefHat, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    Hard: { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    Expert: { icon: Award, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };

  const { icon: Icon, color, bg, border } = config[level];

  return (
    <CookingBadge variant="difficulty" className={cn(bg, border)}>
      <Icon className={cn('h-3 w-3', color)} />
      <span>{level}</span>
    </CookingBadge>
  );
}

export function CookingTimeBadge({ minutes }: { minutes: number }) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const display = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <CookingBadge variant="time">
      <Clock className="h-3 w-3" />
      <span>{display}</span>
    </CookingBadge>
  );
}

export function ServingsBadge({ count }: { count: number }) {
  return (
    <CookingBadge variant="servings">
      <Users className="h-3 w-3" />
      <span>{count} servings</span>
    </CookingBadge>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Recipe Card Component ------------------------- */
/* -------------------------------------------------------------------------- */

export function RecipeCard({ 
  recipe,
  onClick,
  className
}: {
  recipe: {
    id: number;
    name: string;
    imageUrl?: string | null;
    cuisine?: string | null;
    category?: string | null;
    cookingTime?: number | null;
    servings?: number | null;
    isFavorite?: boolean;
  };
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn('cursor-pointer', className)}
      onClick={onClick}
    >
      <PCCard className="overflow-hidden p-0 group">
        {/* Recipe Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-pc-tan/20 to-pc-olive/20">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="h-16 w-16 text-pc-tan/40" />
            </div>
          )}
          
          {/* Favorite Badge */}
          {recipe.isFavorite && (
            <div className="absolute top-3 right-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Recipe Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-pc-navy text-lg line-clamp-2 group-hover:text-pc-olive transition-colors">
              {recipe.name}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {recipe.cuisine && (
              <CookingBadge variant="cuisine">
                <UtensilsCrossed className="h-3 w-3" />
                {recipe.cuisine}
              </CookingBadge>
            )}
            {recipe.category && (
              <CookingBadge variant="category">
                {recipe.category}
              </CookingBadge>
            )}
            {recipe.cookingTime && (
              <CookingTimeBadge minutes={recipe.cookingTime} />
            )}
            {recipe.servings && (
              <ServingsBadge count={recipe.servings} />
            )}
          </div>
        </div>
      </PCCard>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Cooking Timer Component ----------------------- */
/* -------------------------------------------------------------------------- */

export function CookingTimer({ 
  minutes, 
  onComplete,
  size = 'md'
}: { 
  minutes: number; 
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [timeLeft, setTimeLeft] = React.useState(minutes * 60);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft === 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const progress = ((minutes * 60 - timeLeft) / (minutes * 60)) * 100;

  const sizes = {
    sm: 'w-16 h-16 text-sm',
    md: 'w-24 h-24 text-base',
    lg: 'w-32 h-32 text-lg',
  };

  return (
    <div className={cn('relative', sizes[size])}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-pc-tan/20"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          className="text-pc-olive transition-all duration-1000"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="font-bold text-pc-navy">
            {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-pc-olive hover:text-pc-navy"
      >
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Ingredient Card Component ---------------------- */
/* -------------------------------------------------------------------------- */

export function IngredientCard({
  ingredient,
  quantity,
  unit,
  onRemove,
  className
}: {
  ingredient: {
    id: number;
    name: string;
    category?: string | null;
    imageUrl?: string | null;
  };
  quantity?: string | null;
  unit?: string | null;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn('relative', className)}
    >
      <PCCard className="p-4">
        <div className="flex items-center gap-3">
          {/* Ingredient Image/Icon */}
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {ingredient.imageUrl ? (
              <img
                src={ingredient.imageUrl}
                alt={ingredient.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UtensilsCrossed className="h-8 w-8 text-pc-olive/60" />
            )}
          </div>

          {/* Ingredient Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-pc-navy truncate">{ingredient.name}</h4>
            {(quantity || unit) && (
              <p className="text-sm text-pc-text-light">
                {quantity} {unit}
              </p>
            )}
            {ingredient.category && (
              <CookingBadge variant="category" className="mt-1 text-xs">
                {ingredient.category}
              </CookingBadge>
            )}
          </div>

          {/* Remove Button */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
              aria-label="Remove ingredient"
            >
              ×
            </button>
          )}
        </div>
      </PCCard>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Kitchen Stats Card ----------------------------- */
/* -------------------------------------------------------------------------- */

export function KitchenStatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = 'pc-olive',
  href,
  className
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: 'pc-olive' | 'pc-navy' | 'pc-tan';
  href?: string;
  className?: string;
}) {
  const colorClasses = {
    'pc-olive': 'bg-pc-olive/10 text-pc-olive border-pc-olive/20',
    'pc-navy': 'bg-pc-navy/10 text-pc-navy border-pc-navy/20',
    'pc-tan': 'bg-pc-tan/20 text-pc-olive border-pc-tan/30',
  };

  const content = (
    <PCCard className={cn('hover:shadow-pc-lg transition-all cursor-pointer group', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-pc-text-light mb-1">{label}</p>
          <p className="text-3xl font-bold text-pc-navy group-hover:text-pc-olive transition-colors">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-pc-text-light mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-4 rounded-xl border', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </PCCard>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Cooking Progress Indicator --------------------- */
/* -------------------------------------------------------------------------- */

export function CookingProgress({
  currentStep,
  totalSteps,
  label
}: {
  currentStep: number;
  totalSteps: number;
  label?: string;
}) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-pc-navy font-medium">{label}</span>
          <span className="text-pc-text-light">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      )}
      <div className="w-full bg-pc-tan/20 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-pc-olive to-pc-navy rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Temperature Display ---------------------------- */
/* -------------------------------------------------------------------------- */

export function TemperatureDisplay({
  temperature,
  unit = 'F',
  label
}: {
  temperature: number;
  unit?: 'F' | 'C';
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-lg bg-red-50 border border-red-200">
        <Thermometer className="h-5 w-5 text-red-600" />
      </div>
      <div>
        {label && <p className="text-xs text-pc-text-light">{label}</p>}
        <p className="text-lg font-bold text-pc-navy">
          {temperature}°{unit}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------------ Empty State ------------------------------- */
/* -------------------------------------------------------------------------- */

export function PCEmpty({
  title,
  subtitle,
  cta
}: {
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-40 h-40 rounded-2xl bg-pc-tan/20 flex items-center justify-center text-3xl font-semibold">
        <ChefHat className="h-16 w-16 text-pc-olive/40" />
      </div>
      <h3 className="mt-6 text-lg font-semibold" style={{color:'var(--pc-navy)'}}>
        {title}
      </h3>
      {subtitle && (
        <p className="mt-2 text-sm text-pc-text-light max-w-md mx-auto">
          {subtitle}
        </p>
      )}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}


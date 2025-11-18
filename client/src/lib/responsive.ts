/**
 * Responsive Design Utilities
 * Consistent breakpoints and responsive patterns for mobile-first design
 */

import { cn } from './utils';

/**
 * Tailwind breakpoints for reference:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

/**
 * Responsive container classes
 * Use these for consistent max-widths and padding across pages
 */
export const containers = {
  // Narrow content (articles, forms)
  narrow: 'max-w-2xl mx-auto',

  // Standard content (most pages)
  standard: 'max-w-4xl mx-auto',

  // Wide content (dashboards, grids)
  wide: 'max-w-6xl mx-auto',

  // Full width (special layouts)
  full: 'max-w-7xl mx-auto',
} as const;

/**
 * Responsive padding classes
 * Ensures consistent breathing room on all devices
 */
export const padding = {
  page: cn(
    'px-4 py-6',      // Mobile: compact
    'md:px-6 md:py-8', // Tablet: more space
    'lg:px-8 lg:py-10' // Desktop: generous
  ),

  section: cn(
    'px-4 py-4',      // Mobile
    'md:px-6 md:py-6', // Tablet
    'lg:px-8 lg:py-8'  // Desktop
  ),

  card: cn(
    'p-4',       // Mobile
    'md:p-5',    // Tablet
    'lg:p-6'     // Desktop
  ),
} as const;

/**
 * Responsive gap/spacing classes for grids and flexbox
 */
export const gaps = {
  tight: cn('gap-2 md:gap-3 lg:gap-4'),
  normal: cn('gap-4 md:gap-5 lg:gap-6'),
  relaxed: cn('gap-6 md:gap-8 lg:gap-10'),
} as const;

/**
 * Responsive grid column classes
 * Common patterns for card grids
 */
export const grids = {
  // Cards: 1 col mobile, 2 col tablet, 3 col desktop
  cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

  // Features: 1 col mobile, 2 col tablet, 2 col desktop
  features: 'grid grid-cols-1 md:grid-cols-2',

  // Stats: 2 col mobile, 3 col tablet, 4 col desktop
  stats: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',

  // List: 1 col mobile, 1 col tablet, 2 col desktop
  list: 'grid grid-cols-1 lg:grid-cols-2',

  // Sidebar layout: 1 col mobile, 1 col tablet, 3-column with sidebar desktop
  withSidebar: 'grid grid-cols-1 lg:grid-cols-[300px_1fr]',

  // Recipe detail: Ingredients sidebar
  recipeDetail: 'grid grid-cols-1 lg:grid-cols-[350px_1fr]',
} as const;

/**
 * Responsive typography classes
 * Text scales up on larger screens
 */
export const text = {
  // Page headings
  h1: cn(
    'text-3xl font-bold',    // Mobile
    'md:text-4xl',           // Tablet
    'lg:text-5xl'            // Desktop
  ),

  h2: cn(
    'text-2xl font-bold',
    'md:text-3xl',
    'lg:text-4xl'
  ),

  h3: cn(
    'text-xl font-semibold',
    'md:text-2xl',
    'lg:text-3xl'
  ),

  // Body text
  body: cn(
    'text-base',
    'md:text-base',
    'lg:text-lg'
  ),

  small: cn(
    'text-sm',
    'md:text-sm',
    'lg:text-base'
  ),
} as const;

/**
 * Responsive image aspect ratios
 */
export const images = {
  recipeCard: 'aspect-[4/3]',
  recipeHero: 'aspect-[16/9] md:aspect-[21/9]',
  ingredientIcon: 'aspect-square',
} as const;

/**
 * Helper function to create responsive classes
 */
export function responsive(
  mobile: string,
  tablet?: string,
  desktop?: string,
  xl?: string
) {
  return cn(
    mobile,
    tablet && `md:${tablet}`,
    desktop && `lg:${desktop}`,
    xl && `xl:${xl}`
  );
}

/**
 * Common responsive patterns
 */
export const patterns = {
  // Stack on mobile, row on desktop
  stackToRow: 'flex flex-col md:flex-row',

  // Row on mobile, stack on desktop (rare)
  rowToStack: 'flex flex-row md:flex-col',

  // Center on mobile, left-align on desktop
  centerToLeft: 'text-center lg:text-left',

  // Hidden on mobile, visible on desktop
  desktopOnly: 'hidden lg:block',

  // Visible on mobile, hidden on desktop
  mobileOnly: 'block lg:hidden',

  // Card hover effects (stronger on desktop)
  cardHover: cn(
    'transition-all duration-300',
    'hover:shadow-lg',
    'lg:hover:shadow-xl lg:hover:-translate-y-1'
  ),
} as const;

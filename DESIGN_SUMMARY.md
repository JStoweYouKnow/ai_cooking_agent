# AI Cooking Agent - Design System Summary

## 🎨 Project Comfort Design System

The AI Cooking Agent uses a warm, welcoming design system called "Project Comfort" - specifically crafted for novice home chefs to feel confident and inspired in their cooking journey.

## Color Palette

### Primary Colors
- **PC Navy** (`--pc-navy`): Deep, trustworthy navy blue - Used for headings, primary text, and key UI elements
- **PC Olive** (`--pc-olive`): Warm olive green - Represents fresh ingredients, cooking, nature
- **PC Tan** (`--pc-tan`): Soft, warm tan - Creates comfortable backgrounds and accents
- **PC White** (`--pc-white`): Clean white - Base background color

### Accent Colors
- **PC Text Light** (`--pc-text-light`): Softer text for descriptions and secondary information
- **PC Background** (`--pc-bg`): Light background for the overall app

### Gradient Usage
The design makes extensive use of gradients to create depth and visual interest:
- `from-pc-tan/10 to-pc-olive/5` - Subtle ingredient/recipe card backgrounds
- `from-pc-navy to-pc-olive` - Interactive elements like step numbers
- `from-yellow-100 to-yellow-200` - Favorite/highlighted items

## Core Components

### 1. PCCard
**Location**: `client/src/components/project-comfort-ui.tsx`

Animated card component with:
- Soft shadows that elevate on hover
- Rounded corners (rounded-2xl)
- Smooth transitions
- Backdrop blur for modern feel

```tsx
<PCCard className="additional-classes">
  {/* Content */}
</PCCard>
```

### 2. PCButton
**Location**: `client/src/components/project-comfort-ui.tsx`

Interactive button with:
- Scale animations on hover/tap
- Focus ring for accessibility
- Gradient shadow elevation
- Navy background with white text by default

```tsx
<PCButton onClick={handleClick}>
  Action Text
</PCButton>
```

### 3. Cooking-Themed Components
**Location**: `client/src/components/cooking-theme.tsx`

Specialized components for cooking UX:

#### CookingBadge
Variant badges for different types of information:
- `default` - General purpose (tan colors)
- `difficulty` - Cooking difficulty (orange gradient)
- `cuisine` - Cuisine type (amber gradient)
- `category` - Recipe category (green gradient)
- `time` - Cooking time (blue gradient)
- `servings` - Serving count (purple gradient)

#### RecipeCard
Beautiful recipe card with:
- Hover lift animation
- Image zoom on hover
- Favorite star badge overlay
- Gradient overlays for readability
- Cuisine, category, time, and servings badges

#### KitchenStatsCard
Dashboard statistics with:
- Icon in colored background
- Large value display
- Hover shadow effect
- Optional link support

#### CookingProgress
Progress indicator for multi-step recipes:
- Animated gradient progress bar
- Step counter
- Smooth animations

## Page-Specific Designs

### Dashboard
**Location**: `client/src/pages/Dashboard.tsx`

Features:
- Stat highlights with gradient backgrounds
- Recent recipes grid with RecipeCards
- Activity timeline with cooking events
- Quick action buttons with icons
- Cooking playlist inspiration section

Color scheme:
- Green accents for pantry/ingredients
- Amber/orange for recipes
- Purple for shopping
- Pink for energy/motivation

### Ingredients Page
**Location**: `client/src/pages/IngredientsPage.tsx`

Features:
- Ingredient cards with icons
- Image/camera upload for recognition
- Search functionality
- Empty state with chef hat icon
- Quantity and unit display

Icon system:
- Apple: Fruits
- Fish: Seafood
- Circle: Vegetables
- Square: Meats
- Hexagon: Dairy
- Package: Grains
- Box: Nuts/seeds
- Coffee: Beverages
- UtensilsCrossed: Default fallback

### Recipe Search Page
**Location**: `client/src/pages/RecipeSearchPage.tsx`

Features:
- Multi-source selection (TheMealDB, Epicurious, Delish, NYT Cooking)
- Ingredient tag system
- "Use My Pantry" quick action
- Recipe grid with loading skeletons
- URL import section
- Saved recipes collection

### Recipe Detail Page
**Location**: `client/src/pages/RecipeDetailPage.tsx`

Features:
- Full-screen recipe image with zoom hover
- Animated favorite button (yellow gradient when active)
- Source badges with color coding
- Ingredient list with staggered animations
- Numbered instructions with gradient step indicators
- Shopping cart quick-add button
- External link to original recipe (gradient blue card)

Animations:
- Page fade-in from bottom
- Back button slide on hover
- Image scale on hover
- Ingredients fade in with delay
- Instructions slide in sequentially
- Step numbers scale on hover

### Shopping Lists Page
**Location**: `client/src/pages/ShoppingListsPage.tsx`

Features:
- List management cards
- Ingredient search and add
- Checkbox items with strikethrough
- Export functionality (CSV, TXT, MD, JSON)
- Ingredient icons for visual appeal
- Empty state with welcoming message

## Animation Patterns

### Motion Library
**Location**: `client/src/lib/motion.ts`

Standard animations:
- `fadeUp`: Element fades in while moving up slightly
- `fadeIn`: Simple opacity fade

### Framer Motion Usage

The app uses Framer Motion for smooth, professional animations:

```tsx
// Page transitions
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  {/* Page content */}
</motion.div>

// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>

// Staggered list items
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: index * 0.05 }}
>
  {/* List item */}
</motion.div>
```

## Loading States

### RecipeCardSkeleton
**Location**: `client/src/components/RecipeCardSkeleton.tsx`

Animated skeleton for recipe cards with:
- Pulsing animation
- Gradient background matching theme
- Proper aspect ratio

### IngredientCardSkeleton
**Location**: `client/src/components/IngredientCardSkeleton.tsx`

Animated skeleton for ingredient cards with:
- Circular icon placeholder
- Text line placeholders
- Theme-consistent colors

## Empty States

All pages include thoughtful empty states:
- Large icon (ChefHat, UtensilsCrossed, BookOpen)
- Clear heading
- Helpful descriptive text
- Call-to-action button
- Gradient glow effect behind icon

Example:
```tsx
<div className="text-center py-16">
  <div className="relative inline-block mb-6">
    <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-2xl opacity-50" />
    <div className="relative bg-pc-tan/20 p-8 rounded-full">
      <ChefHat className="h-20 w-20 text-pc-olive mx-auto" />
    </div>
  </div>
  <h3 className="text-2xl font-bold text-pc-navy mb-2">No recipes yet</h3>
  <p className="text-pc-text-light mb-6 max-w-md mx-auto">
    Start building your collection!
  </p>
  <PCButton>Get Started</PCButton>
</div>
```

## Interactive Elements

### Hover States
- Cards lift up slightly (`whileHover={{ y: -4 }}`)
- Buttons scale up (`whileHover={{ scale: 1.02 }}`)
- Images zoom in containers
- Shadows intensify
- Colors shift slightly

### Click/Tap States
- Buttons scale down (`whileTap={{ scale: 0.96 }}`)
- Immediate visual feedback
- Smooth spring animations

### Focus States
- Visible focus rings for accessibility
- Navy/olive colored rings
- Offset from element

## Accessibility

- Semantic HTML throughout
- ARIA labels on icon-only buttons
- Keyboard navigation support
- Focus visible styles
- Color contrast meeting WCAG AA standards
- Alt text on all images

## Typography

- Headings: Bold, navy colored
- Body text: Medium weight, navy colored
- Secondary text: Light weight, muted color
- Consistent sizing hierarchy
- Readable line heights (leading-relaxed)

## Spacing

- Consistent padding using Tailwind scale
- 6-unit gaps between major sections
- 4-unit gaps between related items
- 2-3 unit gaps for tight groupings

## Responsive Design

All pages are fully responsive:
- Mobile-first approach
- Grid layouts collapse on small screens
- Touch-friendly tap targets (min 44x44px)
- Readable text sizes on mobile
- Optimized image loading

## Design Principles

1. **Warmth**: Use warm colors (olive, tan, amber) to create welcoming feel
2. **Clarity**: Clear hierarchy, readable text, obvious actions
3. **Delight**: Smooth animations, hover effects, satisfying interactions
4. **Confidence**: Professional polish gives users confidence
5. **Accessibility**: Everyone can use the app effectively
6. **Performance**: Fast loading, optimized images, smooth scrolling

## Future Enhancements

Potential additions to the design system:
- Dark mode variant
- Recipe difficulty indicators with flame icons
- Cooking timer widget
- Temperature conversion tool
- Dietary restriction badges (vegetarian, vegan, gluten-free)
- Star rating system for recipes
- User avatars and profiles
- Social sharing cards

---

**Design Philosophy**: The AI Cooking Agent's design creates a warm, inviting space where novice home chefs feel empowered to explore cooking. Every interaction is smooth, every page is welcoming, and every detail reinforces confidence in the kitchen.

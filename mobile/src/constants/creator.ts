/**
 * Creator Integration Constants
 * Configure creator branding and content for hackathon submission
 * 
 * OPTIONAL: This is for subtle branding. The main requirement is that your app
 * solves the creator's brief. You can remove this entirely if you prefer.
 * 
 * Recommended: Eitan Bernath's brief matches your app perfectly
 * Brief: "Turning Recipe Inspiration into Real Meals"
 * Problem: Home cooks save recipes but rarely cook them
 * Solution: Your app helps turn saved recipes into actual meals
 */

export interface CreatorConfig {
  name: string;
  handle: string;
  avatarUrl?: string;
  bio: string;
  endorsement: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Eitan-branded featured recipes/videos (preloaded creator content) */
  featuredRecipes?: Array<{
    name: string;
    description?: string;
    imageUrl?: string;
    sourceUrl?: string;
  }>;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
}

// Eitan Bernath - Perfect match for your cooking app!
// Brief: "Turning Recipe Inspiration into Real Meals"
// Your app solves his problem: helping home cooks actually cook saved recipes
export const CREATOR_CONFIG: CreatorConfig = {
  name: "Eitan Bernath",
  handle: "@eitan",
  bio: "Food creator helping home cooks turn recipe inspiration into real meals",
  endorsement: "Finally, an app that helps you actually cook the recipes you save!",
  brandColors: {
    primary: "#8B7355", // Olive
    secondary: "#A67C52", // Russet
    accent: "#D4AF37", // Gold accent
  },
  featuredRecipes: [
    {
      name: "Crispy Smashed Potatoes",
      description: "Golden, crispy edges with fluffy centers",
      imageUrl: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400",
      sourceUrl: "https://www.tiktok.com/@eitan",
    },
    {
      name: "One-Pan Pasta",
      description: "Quick weeknight dinner the whole family will love",
      imageUrl: "https://images.unsplash.com/photo-1551183053-bf73a1b7d22c?w=400",
      sourceUrl: "https://www.tiktok.com/@eitan",
    },
    {
      name: "Sheet Pan Fajitas",
      description: "Easy, hands-off dinner with minimal cleanup",
      imageUrl: "https://images.unsplash.com/photo-1599970608062-2d4e1ba2b04e?w=400",
      sourceUrl: "https://www.tiktok.com/@eitan",
    },
  ],
  socialLinks: {
    tiktok: "@eitan",
  },
};

/**
 * Get creator-specific styling
 */
export function getCreatorStyles() {
  return {
    primaryColor: CREATOR_CONFIG.brandColors.primary,
    secondaryColor: CREATOR_CONFIG.brandColors.secondary,
    accentColor: CREATOR_CONFIG.brandColors.accent,
  };
}

/**
 * Get creator endorsement message
 */
export function getCreatorEndorsement(): string {
  return CREATOR_CONFIG.endorsement;
}

/**
 * Get creator name with handle
 */
export function getCreatorDisplayName(): string {
  return `${CREATOR_CONFIG.name} ${CREATOR_CONFIG.handle}`;
}

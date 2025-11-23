"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GradientHero,
  GlassCard,
  SectionHeader,
  PremiumButton,
  DecorativeBlob,
  BackgroundPattern,
} from '@/components/premium-ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FormError } from '@/components/ui/form-error';
import {
  ChefHat,
  Plus,
  Trash2,
  Upload,
  FileJson,
  Sparkles,
  Clock,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { PageTransition } from '@/components/web3/PageTransition';
import { getUUID } from '@/lib/utils';

const RECIPE_SOURCE_USER_IMPORT = 'user_import';

interface IngredientInput {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category?: string;
}

interface RecipeFormData {
  name: string;
  description: string;
  instructions: string;
  imageUrl: string;
  cuisine: string;
  category: string;
  cookingTime: string;
  servings: string;
  sourceUrl: string;
}

interface RecipeJsonData {
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  cuisine?: string;
  category?: string;
  cookingTime?: number;
  servings?: number;
  sourceUrl?: string;
  ingredients?: Array<{
    name: string;
    quantity?: string;
    unit?: string;
    category?: string;
  }>;
}

export default function CreateRecipePage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    description: '',
    instructions: '',
    imageUrl: '',
    cuisine: '',
    category: '',
    cookingTime: '',
    servings: '',
    sourceUrl: '',
  });

  const [ingredients, setIngredients] = useState<IngredientInput[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState<IngredientInput>({
    id: getUUID(),
    name: '',
    quantity: '',
    unit: '',
    category: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RecipeFormData, string>>>({});
  const [jsonUploadError, setJsonUploadError] = useState<string>('');

  const createRecipeMutation = trpc.recipes.create.useMutation({
    onSuccess: async (data) => {
      await utils.recipes.list.invalidate();
      toast.success('Recipe created successfully!');
      router.push(`/recipes/${data.id}` as any);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create recipe');
    },
  });

  const parseFromUrlMutation = trpc.recipes.parseFromUrl.useMutation({
    onSuccess: (data) => {
      if (data && 'parsed' in data && data.parsed) {
        const parsed = data.parsed as RecipeJsonData;
        // Populate form with parsed data
        setFormData({
          name: parsed.name || '',
          description: parsed.description || '',
          instructions: parsed.instructions || '',
          imageUrl: parsed.imageUrl || '',
          cuisine: parsed.cuisine || '',
          category: parsed.category || '',
          cookingTime: parsed.cookingTime ? String(parsed.cookingTime) : '',
          servings: parsed.servings ? String(parsed.servings) : '',
          sourceUrl: formData.sourceUrl,
        });

        // Populate ingredients
        if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
          setIngredients(
            parsed.ingredients.map((ing) => ({
              id: getUUID(),
              name: ing.name || '',
              quantity: ing.quantity || '',
              unit: ing.unit || '',
              category: ing.category || '',
            }))
          );
        }

        toast.success('Recipe data fetched from URL!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to fetch recipe from URL');
    },
  });

  const handleFetchFromUrl = () => {
    if (!formData.sourceUrl.trim()) {
      toast.error('Please enter a source URL');
      return;
    }

    try {
      new URL(formData.sourceUrl.trim());
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    parseFromUrlMutation.mutate({ url: formData.sourceUrl.trim(), autoSave: false });
  };

  const handleInputChange = (field: keyof RecipeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddIngredient = () => {
    if (!currentIngredient.name.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    setIngredients((prev) => [...prev, currentIngredient]);
    setCurrentIngredient({
      id: getUUID(),
      name: '',
      quantity: '',
      unit: '',
      category: '',
    });
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RecipeFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Recipe name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Recipe name must be 255 characters or less';
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must be 5000 characters or less';
    }

    if (formData.instructions && formData.instructions.length > 10000) {
      newErrors.instructions = 'Instructions must be 10000 characters or less';
    }

    if (formData.imageUrl && formData.imageUrl.length > 500) {
      newErrors.imageUrl = 'Image URL must be 500 characters or less';
    }

    if (formData.cookingTime && (isNaN(Number(formData.cookingTime)) || Number(formData.cookingTime) <= 0 || Number(formData.cookingTime) > 1440)) {
      newErrors.cookingTime = 'Cooking time must be between 1 and 1440 minutes';
    }

    if (formData.servings && (isNaN(Number(formData.servings)) || Number(formData.servings) <= 0 || Number(formData.servings) > 100)) {
      newErrors.servings = 'Servings must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // Helper to trim and convert empty strings to undefined
    const trimOrUndefined = (value: string | undefined): string | undefined => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    };

    // Filter and map ingredients, ensuring names are trimmed and non-empty
    const validIngredients = ingredients
      .map((ing) => ({
        name: ing.name.trim(),
        quantity: trimOrUndefined(ing.quantity),
        unit: trimOrUndefined(ing.unit),
        category: trimOrUndefined(ing.category),
      }))
      .filter((ing) => ing.name.length > 0); // Remove ingredients with empty names

    createRecipeMutation.mutate({
      name: formData.name.trim(),
      description: trimOrUndefined(formData.description),
      instructions: trimOrUndefined(formData.instructions),
      imageUrl: trimOrUndefined(formData.imageUrl),
      cuisine: trimOrUndefined(formData.cuisine),
      category: trimOrUndefined(formData.category),
      cookingTime: formData.cookingTime ? Number(formData.cookingTime) : undefined,
      servings: formData.servings ? Number(formData.servings) : undefined,
      sourceUrl: trimOrUndefined(formData.sourceUrl),
      source: RECIPE_SOURCE_USER_IMPORT,
      ingredients: validIngredients.length > 0 ? validIngredients : undefined,
    });
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonUploadError('');

    if (!file.name.endsWith('.json')) {
      setJsonUploadError('Please upload a JSON file');
      toast.error('Please upload a JSON file');
      return;
    }

    try {
      const text = await file.text();
      const data: RecipeJsonData = JSON.parse(text);

      // Validate required fields
      if (!data.name) {
        throw new Error('Recipe name is required in JSON file');
      }

      // Populate form
      setFormData({
        name: data.name || '',
        description: data.description || '',
        instructions: data.instructions || '',
        imageUrl: data.imageUrl || '',
        cuisine: data.cuisine || '',
        category: data.category || '',
        cookingTime: data.cookingTime ? String(data.cookingTime) : '',
        servings: data.servings ? String(data.servings) : '',
        sourceUrl: data.sourceUrl || '',
      });

      // Populate ingredients
      if (data.ingredients && Array.isArray(data.ingredients)) {
        setIngredients(
          data.ingredients.map((ing) => ({
            id: getUUID(),
            name: ing.name || '',
            quantity: ing.quantity || '',
            unit: ing.unit || '',
            category: ing.category || '',
          }))
        );
      }

      toast.success('Recipe loaded from JSON file!');
      e.target.value = ''; // Reset file input
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid JSON file format';
      setJsonUploadError(errorMessage);
      toast.error(errorMessage);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <PageTransition>
      <div className="relative space-y-8 pb-16">
        {/* Background decorative elements */}
        <DecorativeBlob color="olive" position="top-right" size="lg" opacity={0.12} />
        <DecorativeBlob color="tan" position="bottom-left" size="md" opacity={0.08} />

        {/* Hero Header */}
        <GradientHero
          badge={
            <div className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recipe Creation
            </div>
          }
          title="Create Your Own Recipe"
          subtitle="Share your culinary masterpiece"
          description="Add your favorite recipes manually or import from a JSON file. Include all the details, ingredients, and cooking instructions."
        />

        {/* JSON Upload Section */}
        <GlassCard glow={false}>
          <SectionHeader
            icon={FileJson}
            title="Import from JSON"
            description="Upload a JSON file containing recipe data (name, description, ingredients, etc.)"
          />
          <div className="mt-6">
            <div className="border-2 border-dashed border-pc-tan/40 rounded-xl p-8 text-center bg-gradient-to-br from-pc-tan/5 to-pc-olive/5 hover:border-pc-olive/50 transition-colors">
              <input
                type="file"
                id="json-upload"
                accept=".json"
                onChange={handleJsonUpload}
                className="hidden"
              />
              <label htmlFor="json-upload" className="cursor-pointer">
                <Upload className="h-16 w-16 text-pc-olive mx-auto mb-4" />
                <p className="text-pc-navy font-semibold text-lg mb-2">
                  Click to upload JSON file
                </p>
                <p className="text-pc-text-light text-sm">
                  Supports .json files with recipe data
                </p>
              </label>
            </div>
            {jsonUploadError && <FormError error={jsonUploadError} className="mt-3" />}

            {/* Example JSON format */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-pc-navy hover:text-pc-olive transition-colors">
                View example JSON format
              </summary>
              <pre className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto">
{`{
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta dish",
  "instructions": "1. Cook pasta\\n2. Fry bacon\\n3. Mix eggs and cheese\\n4. Combine all",
  "imageUrl": "https://example.com/carbonara.jpg",
  "cuisine": "Italian",
  "category": "Main Course",
  "cookingTime": 30,
  "servings": 4,
  "sourceUrl": "https://example.com/recipe",
  "ingredients": [
    { "name": "Spaghetti", "quantity": "400", "unit": "g" },
    { "name": "Bacon", "quantity": "200", "unit": "g" },
    { "name": "Eggs", "quantity": "3", "unit": "" },
    { "name": "Parmesan", "quantity": "100", "unit": "g", "category": "Dairy" }
  ]
}`}
              </pre>
            </details>
          </div>
        </GlassCard>

        {/* Manual Entry Form */}
        <form onSubmit={handleSubmit}>
          <GlassCard glow className="border-2 border-pc-olive/20">
            <SectionHeader
              icon={ChefHat}
              title="Recipe Details"
              description="Fill in the information about your recipe"
            />

            <div className="mt-8 space-y-6">
              {/* Source URL - At the top for easy auto-fill */}
              <div className="p-4 bg-gradient-to-r from-pc-olive/5 to-pc-navy/5 rounded-xl border-2 border-pc-olive/20">
                <Label htmlFor="sourceUrl" className="text-base font-semibold text-pc-navy mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pc-olive" />
                  Quick Start: Import from URL
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="sourceUrl"
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
                    placeholder="Paste a recipe URL to auto-fill the form..."
                    className="h-12 text-base border-pc-tan/20 flex-1"
                    maxLength={500}
                  />
                  <PremiumButton
                    type="button"
                    onClick={handleFetchFromUrl}
                    disabled={parseFromUrlMutation.isPending || !formData.sourceUrl.trim()}
                    className="h-12 px-6 gap-2"
                    color="olive"
                  >
                    <Sparkles className="h-4 w-4" />
                    {parseFromUrlMutation.isPending ? 'Fetching...' : 'Auto-Fill'}
                  </PremiumButton>
                </div>
                <p className="text-sm text-pc-text-light mt-2">
                  Paste a recipe URL and click Auto-Fill to automatically populate the form with recipe data, ingredients, and images from the source
                </p>
              </div>

              {/* Recipe Name */}
              <div>
                <Label htmlFor="name" className="text-base font-semibold text-pc-navy mb-2">
                  Recipe Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Grandma's Apple Pie"
                  className="h-12 text-base border-pc-tan/20"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  maxLength={255}
                />
                <FormError id="name-error" error={errors.name} />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-semibold text-pc-navy mb-2">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your recipe..."
                  className="w-full min-h-[100px] p-3 border border-pc-tan/20 rounded-lg text-base focus:ring-2 focus:ring-pc-olive focus:border-transparent resize-y"
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'description-error' : undefined}
                  maxLength={5000}
                />
                <FormError id="description-error" error={errors.description} />
              </div>

              {/* Instructions */}
              <div>
                <Label htmlFor="instructions" className="text-base font-semibold text-pc-navy mb-2">
                  Cooking Instructions
                </Label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Step-by-step cooking instructions..."
                  className="w-full min-h-[200px] p-3 border border-pc-tan/20 rounded-lg text-base focus:ring-2 focus:ring-pc-olive focus:border-transparent resize-y font-mono"
                  aria-invalid={!!errors.instructions}
                  aria-describedby={errors.instructions ? 'instructions-error' : undefined}
                  maxLength={10000}
                />
                <FormError id="instructions-error" error={errors.instructions} />
              </div>

              {/* Row: Cuisine, Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="cuisine" className="text-base font-semibold text-pc-navy mb-2">
                    Cuisine
                  </Label>
                  <Input
                    id="cuisine"
                    value={formData.cuisine}
                    onChange={(e) => handleInputChange('cuisine', e.target.value)}
                    placeholder="e.g., Italian, Mexican, Asian"
                    className="h-12 text-base border-pc-tan/20"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-base font-semibold text-pc-navy mb-2">
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g., Dessert, Main Course, Appetizer"
                    className="h-12 text-base border-pc-tan/20"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Row: Cooking Time, Servings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="cookingTime" className="text-base font-semibold text-pc-navy mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Cooking Time (minutes)
                  </Label>
                  <Input
                    id="cookingTime"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.cookingTime}
                    onChange={(e) => handleInputChange('cookingTime', e.target.value)}
                    placeholder="e.g., 30"
                    className="h-12 text-base border-pc-tan/20"
                    aria-invalid={!!errors.cookingTime}
                    aria-describedby={errors.cookingTime ? 'cookingTime-error' : undefined}
                  />
                  <FormError id="cookingTime-error" error={errors.cookingTime} />
                </div>

                <div>
                  <Label htmlFor="servings" className="text-base font-semibold text-pc-navy mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Servings
                  </Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.servings}
                    onChange={(e) => handleInputChange('servings', e.target.value)}
                    placeholder="e.g., 4"
                    className="h-12 text-base border-pc-tan/20"
                    aria-invalid={!!errors.servings}
                    aria-describedby={errors.servings ? 'servings-error' : undefined}
                  />
                  <FormError id="servings-error" error={errors.servings} />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <Label htmlFor="imageUrl" className="text-base font-semibold text-pc-navy mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/recipe-image.jpg"
                  className="h-12 text-base border-pc-tan/20"
                  aria-invalid={!!errors.imageUrl}
                  aria-describedby={errors.imageUrl ? 'imageUrl-error' : undefined}
                  maxLength={500}
                />
                <FormError id="imageUrl-error" error={errors.imageUrl} />
              </div>
            </div>
          </GlassCard>

          {/* Ingredients Section */}
          <GlassCard glow={false} className="mt-8">
            <SectionHeader
              icon={Plus}
              title="Ingredients"
              description="Add all the ingredients needed for this recipe"
            />

            <div className="mt-6 space-y-4">
              {/* Ingredient Input */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <Input
                    value={currentIngredient.name}
                    onChange={(e) =>
                      setCurrentIngredient((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ingredient name"
                    className="h-12 text-base border-pc-tan/20"
                    maxLength={255}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    value={currentIngredient.quantity}
                    onChange={(e) =>
                      setCurrentIngredient((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    placeholder="Quantity"
                    className="h-12 text-base border-pc-tan/20"
                    maxLength={100}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    value={currentIngredient.unit}
                    onChange={(e) =>
                      setCurrentIngredient((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="Unit"
                    className="h-12 text-base border-pc-tan/20"
                    maxLength={50}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    value={currentIngredient.category}
                    onChange={(e) =>
                      setCurrentIngredient((prev) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="Category"
                    className="h-12 text-base border-pc-tan/20"
                    maxLength={100}
                  />
                </div>
                <div className="md:col-span-2">
                  <PremiumButton
                    type="button"
                    onClick={handleAddIngredient}
                    size="lg"
                    color="olive"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </PremiumButton>
                </div>
              </div>

              {/* Ingredients List */}
              {ingredients.length > 0 && (
                <div className="bg-gradient-to-br from-pc-tan/10 to-pc-olive/5 rounded-xl p-6 border border-pc-olive/20">
                  <h4 className="font-semibold text-pc-navy mb-4 flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Added Ingredients ({ingredients.length})
                  </h4>
                  <div className="space-y-2">
                    {ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-pc-tan/30"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium text-pc-navy">{ing.name}</span>
                          {(ing.quantity || ing.unit) && (
                            <Badge variant="outline" className="text-pc-text-light">
                              {ing.quantity} {ing.unit}
                            </Badge>
                          )}
                          {ing.category && (
                            <Badge variant="outline" className="bg-pc-tan/10 text-pc-navy border-pc-tan/30">
                              {ing.category}
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                          aria-label={`Remove ${ing.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <PremiumButton
              type="submit"
              size="lg"
              color="navy"
              disabled={createRecipeMutation.isPending}
              className="min-w-[200px]"
            >
              <ChefHat className="h-5 w-5" />
              {createRecipeMutation.isPending ? 'Creating Recipe...' : 'Create Recipe'}
            </PremiumButton>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}

import { useState } from 'react';
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import {
  GradientHero,
  GlassCard,
  SectionHeader,
  PremiumButton,
  DecorativeBlob,
  BackgroundPattern,
  GradientText
} from '@/components/premium-ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Plus, Search, Trash2, Upload, ChefHat, Sparkles, Apple } from 'lucide-react';
import { getIngredientIcon } from '@/lib/ingredientIcons';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { IngredientCardSkeleton } from '@/components/IngredientCardSkeleton';

export default function IngredientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: '' });
  const [imageUrl, setImageUrl] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: userIngredients, isLoading, error: userIngredientsError } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: allIngredients, error: allIngredientsError } = trpc.ingredients.list.useQuery();

  const addToUserListMutation = trpc.ingredients.addToUserList.useMutation({
    onSuccess: () => {
      utils.ingredients.getUserIngredients.invalidate();
      setNewIngredient({ name: '', quantity: '', unit: '' });
      setIsAddDialogOpen(false);
      toast.success('Ingredient added to your pantry');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeFromUserListMutation = trpc.ingredients.removeFromUserList.useMutation({
    onSuccess: () => {
      utils.ingredients.getUserIngredients.invalidate();
      toast.success('Ingredient removed from your pantry');
    },
  });

  const getOrCreateMutation = trpc.ingredients.getOrCreate.useMutation({
    onSuccess: (ingredient) => {
      addToUserListMutation.mutate({
        ingredientId: ingredient.id,
        quantity: newIngredient.quantity || undefined,
        unit: newIngredient.unit || undefined,
      });
    },
  });

  const uploadImageMutation = trpc.ingredients.uploadImage.useMutation();
  const recognizeFromImageMutation = trpc.ingredients.recognizeFromImage.useMutation({
    onSuccess: async (ingredientNames: string[]) => {
      toast.success(`Found ${ingredientNames.length} ingredients in the image`);
      // Add each ingredient with the image URL
      for (const name of ingredientNames) {
        const ingredient = await getOrCreateMutation.mutateAsync({ 
          name,
          imageUrl: imageUrl || undefined 
        });
        await addToUserListMutation.mutateAsync({ ingredientId: ingredient.id });
      }
    },
    onError: (error) => {
      toast.error('Failed to recognize ingredients: ' + error.message);
    },
  });

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim()) {
      toast.error('Please enter an ingredient name');
      return;
    }
    getOrCreateMutation.mutate({ name: newIngredient.name });
  };

  const handleRecognizeFromImage = () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    recognizeFromImageMutation.mutate({ imageUrl });
  };

  const filteredIngredients = userIngredients?.filter((ui) =>
    allIngredients?.find(i => i.id === ui.ingredientId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative space-y-8 pb-16">
      {/* Background decorative elements */}
      <DecorativeBlob
        color="olive"
        position="top-right"
        size="lg"
        opacity={0.1}
      />
      <DecorativeBlob
        color="tan"
        position="bottom-left"
        size="md"
        opacity={0.08}
      />

      {/* Hero Header */}
      <div className="flex items-start justify-between gap-6">
        <GradientHero
          badge={
            <div className="inline-flex items-center gap-2">
              <Apple className="h-4 w-4" />
              Pantry Management
            </div>
          }
          title="My Ingredients"
          subtitle="Smart pantry tracking"
          description="Manage your pantry and discover what you can cook with AI-powered ingredient recognition."
          className="flex-1"
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <PremiumButton size="lg" color="olive" className="mt-4">
              <Plus className="h-4 w-4" />
              Add Ingredient
            </PremiumButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Ingredient</DialogTitle>
              <DialogDescription>
                Add ingredients to your pantry by text or image
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="text">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">
                  <Search className="h-4 w-4 mr-2" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="image">
                  <Camera className="h-4 w-4 mr-2" />
                  Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="name">Ingredient Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Tomatoes"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      placeholder="e.g., 2"
                      value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      placeholder="e.g., cups"
                      value={newIngredient.unit}
                      onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    />
                  </div>
                </div>
                <PremiumButton
                  size="lg"
                  color="olive"
                  className="w-full"
                  onClick={handleAddIngredient}
                  disabled={addToUserListMutation.isPending || getOrCreateMutation.isPending}
                >
                  Add to Pantry
                </PremiumButton>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div>
                  <Label htmlFor="imageFile">Upload Photo</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          // Convert to base64
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const dataUrl = reader.result as string;
                            
                            try {
                              // Upload to S3
                              const result = await uploadImageMutation.mutateAsync({
                                imageData: dataUrl,
                                fileName: file.name,
                                contentType: file.type,
                              });
                              
                              // Recognize ingredients from uploaded image
                              await recognizeFromImageMutation.mutateAsync({
                                imageUrl: result.url,
                              });
                            } catch (error: any) {
                              // Fallback: try direct recognition if S3 not configured
                              if (error.message?.includes('S3')) {
                                toast.warning('S3 not configured. Using direct image recognition...');
                                await recognizeFromImageMutation.mutateAsync({
                                  imageUrl: dataUrl,
                                });
                              } else {
                                throw error;
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        } catch (error: any) {
                          toast.error('Failed to process image: ' + error.message);
                        }
                      }}
                    />
                    <label
                      htmlFor="imageFile"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-pc-tan/40 rounded-pc cursor-pointer hover:bg-pc-tan/20 transition-colors"
                    >
                      <Camera className="h-8 w-8 text-pc-olive mb-2" />
                      <span className="text-sm text-pc-text-light">Tap to take photo or choose file</span>
                    </label>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-pc-white px-2 text-pc-text-light">Or</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                <PremiumButton
                  size="lg"
                  color="navy"
                  className="w-full"
                  onClick={handleRecognizeFromImage}
                  disabled={recognizeFromImageMutation.isPending || !imageUrl.trim()}
                >
                  <Upload className="h-4 w-4" />
                  {recognizeFromImageMutation.isPending ? 'Analyzing...' : 'Analyze Image'}
                </PremiumButton>
                <p className="text-xs text-pc-text-light text-center">
                  Our AI will analyze the image and detect ingredients automatically
                </p>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <GlassCard glow={false}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-pc-text-light" />
          <Input
            placeholder="Search your ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-base border-pc-tan/20"
          />
        </div>
      </GlassCard>

      {/* Ingredients List */}
      <div className="relative">
        <BackgroundPattern pattern="mesh" opacity={0.04} className="rounded-2xl" />
        <GlassCard glow={false} className="relative z-10">
          <SectionHeader
            icon={ChefHat}
            title={`Your Pantry (${userIngredients?.length || 0} items)`}
            description="Ingredients you have on hand"
          />
          <div className="mt-8">
        <div>
          {userIngredientsError && (
            <div className="text-center py-8 text-red-600">
              <p>Error loading ingredients: {userIngredientsError.message}</p>
            </div>
          )}
          {allIngredientsError && (
            <div className="text-center py-8 text-red-600">
              <p>Error loading ingredient list: {allIngredientsError.message}</p>
            </div>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <IngredientCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredIngredients && filteredIngredients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIngredients.map((userIngredient) => {
                const ingredient = allIngredients?.find(i => i.id === userIngredient.ingredientId);
                if (!ingredient) return null;

                const quantityDisplay = [userIngredient.quantity, userIngredient.unit]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <PCCard key={userIngredient.id} className="hover:shadow-pc-lg transition-shadow p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {ingredient.imageUrl ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-pc-tan/20 flex-shrink-0 relative">
                            <img 
                              src={ingredient.imageUrl} 
                              alt={ingredient.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image and show icon on error
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector('.ingredient-icon-fallback') as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }
                              }}
                            />
                            {(() => {
                              const Icon = getIngredientIcon(ingredient);
                              return (
                                <div className="absolute inset-0 bg-pc-tan/40 flex items-center justify-center ingredient-icon-fallback" style={{ display: 'none' }}>
                                  <Icon className="h-5 w-5 text-pc-olive" />
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          (() => {
                            const Icon = getIngredientIcon(ingredient);
                            return (
                              <div className="bg-pc-tan/40 p-2 rounded-lg flex-shrink-0">
                                <Icon className="h-5 w-5 text-pc-olive" />
                              </div>
                            );
                          })()
                        )}
                        <div>
                          <h3 className="font-semibold text-pc-navy">{ingredient.name}</h3>
                          {quantityDisplay && (
                            <p className="text-sm text-pc-text-light mt-1">{quantityDisplay}</p>
                          )}
                          {ingredient.category && (
                            <p className="text-xs text-pc-text-light mt-1">{ingredient.category}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromUserListMutation.mutate({ id: userIngredient.id })}
                        disabled={removeFromUserListMutation.isPending}
                        className="p-2 rounded-lg hover:bg-pc-tan/30 transition text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </PCCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-pc-tan/30 rounded-full blur-3xl opacity-60" />
                <div className="relative bg-gradient-to-br from-pc-tan/30 to-pc-olive/20 p-10 rounded-full">
                  <ChefHat className="h-24 w-24 text-pc-olive mx-auto" />
                </div>
              </div>
              <GradientText className="text-3xl font-bold mb-4">
                {searchQuery ? 'No matches found' : 'Your pantry is empty'}
              </GradientText>
              <p className="text-pc-text-light mb-8 max-w-md mx-auto text-lg">
                {searchQuery
                  ? 'Try different search terms or add new ingredients to your pantry'
                  : 'Start building your ingredient collection to discover amazing recipes!'}
              </p>
              {!searchQuery && (
                <PremiumButton
                  onClick={() => setIsAddDialogOpen(true)}
                  size="lg"
                  color="olive"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Ingredient
                </PremiumButton>
              )}
            </div>
          )}
        </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

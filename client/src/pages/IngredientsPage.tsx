import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Apple, Camera, Plus, Search, Trash2, Upload, ChefHat } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { IngredientCardSkeleton } from '@/components/IngredientCardSkeleton';

export default function IngredientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '', unit: '' });
  const [imageUrl, setImageUrl] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: userIngredients, isLoading } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: allIngredients } = trpc.ingredients.list.useQuery();

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
      // Add each ingredient
      for (const name of ingredientNames) {
        const ingredient = await getOrCreateMutation.mutateAsync({ name });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Ingredients</h1>
          <p className="mt-2 text-gray-600">
            Manage your pantry and discover what you can cook
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Ingredient
            </Button>
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
                <Button
                  className="w-full"
                  onClick={handleAddIngredient}
                  disabled={addToUserListMutation.isPending || getOrCreateMutation.isPending}
                >
                  Add to Pantry
                </Button>
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
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Tap to take photo or choose file</span>
                    </label>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
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
                <Button
                  className="w-full gap-2"
                  onClick={handleRecognizeFromImage}
                  disabled={recognizeFromImageMutation.isPending || !imageUrl.trim()}
                >
                  <Upload className="h-4 w-4" />
                  {recognizeFromImageMutation.isPending ? 'Analyzing...' : 'Analyze Image'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Our AI will analyze the image and detect ingredients automatically
                </p>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search your ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ingredients List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Pantry ({userIngredients?.length || 0} items)</CardTitle>
          <CardDescription>Ingredients you have on hand</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <Card key={userIngredient.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-green-50 p-2 rounded-lg">
                            <Apple className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{ingredient.name}</h3>
                            {quantityDisplay && (
                              <p className="text-sm text-gray-600 mt-1">{quantityDisplay}</p>
                            )}
                            {ingredient.category && (
                              <p className="text-xs text-gray-500 mt-1">{ingredient.category}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromUserListMutation.mutate({ id: userIngredient.id })}
                          disabled={removeFromUserListMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-orange-100 rounded-full blur-2xl opacity-50" />
                <div className="relative bg-gradient-to-br from-orange-100 to-orange-50 p-8 rounded-full">
                  <ChefHat className="h-20 w-20 text-orange-600 mx-auto" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No matches found' : 'Your pantry is empty'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try different search terms or add new ingredients to your pantry'
                  : 'Start building your ingredient collection to discover amazing recipes!'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)} 
                  className="gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Ingredient
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

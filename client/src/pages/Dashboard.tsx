import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Apple, BookOpen, ShoppingCart, Star, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

export default function Dashboard() {
  const { data: recipes, isLoading: recipesLoading } = trpc.recipes.list.useQuery();
  const { data: ingredients, isLoading: ingredientsLoading } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: shoppingLists, isLoading: listsLoading } = trpc.shoppingLists.list.useQuery();

  const favoriteRecipes = recipes?.filter(r => r.isFavorite) || [];
  const recentRecipes = recipes?.slice(0, 3) || [];

  const stats = [
    {
      name: 'My Ingredients',
      value: ingredients?.length || 0,
      icon: Apple,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/ingredients',
    },
    {
      name: 'Saved Recipes',
      value: recipes?.length || 0,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/recipes',
    },
    {
      name: 'Shopping Lists',
      value: shoppingLists?.length || 0,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/shopping-lists',
    },
    {
      name: 'Favorite Recipes',
      value: favoriteRecipes.length,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      href: '/recipes',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Manage your ingredients, discover recipes, and plan your meals.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/ingredients">
              <Button className="w-full gap-2" variant="outline" size="lg">
                <Plus className="h-4 w-4" />
                Add Ingredients
              </Button>
            </Link>
            <Link href="/recipes">
              <Button className="w-full gap-2" variant="outline" size="lg">
                <BookOpen className="h-4 w-4" />
                Find Recipes
              </Button>
            </Link>
            <Link href="/shopping-lists">
              <Button className="w-full gap-2" variant="outline" size="lg">
                <ShoppingCart className="h-4 w-4" />
                Create Shopping List
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Recipes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Recipes</CardTitle>
              <CardDescription>Your recently added recipes</CardDescription>
            </div>
            <Link href="/recipes">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recipesLoading ? (
            <div className="text-center py-8 text-gray-500">Loading recipes...</div>
          ) : recentRecipes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recipes yet. Start by finding recipes!</p>
              <Link href="/recipes">
                <Button className="mt-4">Find Recipes</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentRecipes.map((recipe) => (
                <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1">{recipe.name}</h3>
                    {recipe.cuisine && (
                      <p className="text-sm text-gray-600">{recipe.cuisine}</p>
                    )}
                    {recipe.isFavorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Getting Started */}
      {(!recipes || recipes.length === 0) && (
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Add ingredients you have on hand to your pantry</li>
              <li>Search for recipes based on your ingredients</li>
              <li>Save your favorite recipes for quick access</li>
              <li>Create shopping lists for missing ingredients</li>
              <li>Export your shopping lists in various formats</li>
            </ol>
            <div className="mt-4 flex gap-2">
              <Link href="/ingredients">
                <Button>Start Adding Ingredients</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

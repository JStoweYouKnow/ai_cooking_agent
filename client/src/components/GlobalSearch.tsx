"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, BookOpen, Apple, ShoppingCart, Home, Settings, ChefHat, Clock, Users } from 'lucide-react';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Fetch recipes for search
  const { data: recipes, isLoading: recipesLoading } = trpc.recipes.list.useQuery(undefined, {
    enabled: open, // Only fetch when dialog is open
  });

  // Register global function to open search
  useEffect(() => {
    (window as any).__openCommandPalette = () => setOpen(true);
    
    // Keyboard shortcut: Cmd/Ctrl + K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      delete (window as any).__openCommandPalette;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = useCallback((value: string) => {
    setOpen(false);
    setSearch('');
    
    if (value.startsWith('/')) {
      // Navigation item
      window.location.href = value;
    } else if (value.startsWith('recipe:')) {
      // Recipe item
      const recipeId = value.replace('recipe:', '');
      window.location.href = `/recipes/${recipeId}`;
    }
  }, []);

  // Filter recipes based on search
  const filteredRecipes = recipes?.filter(recipe => 
    recipe.name.toLowerCase().includes(search.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(search.toLowerCase()) ||
    recipe.cuisine?.toLowerCase().includes(search.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8) || [];

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Recipes', href: '/recipes', icon: BookOpen },
    { name: 'Ingredients', href: '/ingredients', icon: Apple },
    { name: 'Shopping Lists', href: '/shopping-lists', icon: ShoppingCart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNav = navigationItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      title="Search"
      description="Search recipes or navigate to a page"
    >
      <CommandInput 
        placeholder="Search recipes, pages..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {recipesLoading ? 'Loading...' : 'No results found.'}
        </CommandEmpty>
        
        {/* Navigation */}
        {filteredNav.length > 0 && (
          <CommandGroup heading="Pages">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={item.href}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Recipes */}
        {filteredRecipes.length > 0 && (
          <CommandGroup heading="Recipes">
            {filteredRecipes.map((recipe) => (
              <CommandItem
                key={recipe.id}
                value={`recipe:${recipe.id}`}
                onSelect={handleSelect}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  {recipe.imageUrl ? (
                    <img 
                      src={recipe.imageUrl} 
                      alt="" 
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-pc-olive/10 flex items-center justify-center">
                      <ChefHat className="h-4 w-4 text-pc-olive" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{recipe.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {recipe.cuisine && <span>{recipe.cuisine}</span>}
                      {recipe.cookingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recipe.cookingTime}m
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions when no search */}
        {!search && (
          <CommandGroup heading="Quick Actions">
            <CommandItem
              value="/recipes"
              onSelect={handleSelect}
              className="cursor-pointer"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Browse all recipes</span>
            </CommandItem>
            <CommandItem
              value="/ingredients"
              onSelect={handleSelect}
              className="cursor-pointer"
            >
              <Apple className="mr-2 h-4 w-4" />
              <span>Manage pantry</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}


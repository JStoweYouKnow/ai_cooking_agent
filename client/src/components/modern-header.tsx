/*
  Modern Header Component
  Clean, simple header inspired by modern cooking sites
*/

"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChefHat,
  Search,
  Bookmark,
  User,
  Menu,
  LogOut,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ModernHeader({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}) {
  const pathname = usePathname();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const [searchFocused, setSearchFocused] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const navigation = [
    { name: 'Recipes', href: '/recipes', icon: null },
    { name: 'Ingredients', href: '/ingredients', icon: null },
    { name: 'Shopping Lists', href: '/shopping-lists', icon: null },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      {/* Top Section */}
      <div className="flex h-16 items-center gap-4 px-4 md:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="bg-pc-olive p-2 rounded-lg">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-2xl text-pc-navy group-hover:text-pc-olive transition-all duration-300 tracking-tight">
            Sous
          </span>
        </Link>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div
            className={cn(
              "relative group",
              searchFocused && "ring-2 ring-pc-olive/20 rounded-lg"
            )}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="What would you like to cook?"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onClick={onSearchClick}
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200",
                "bg-gray-50/50 text-gray-900 placeholder:text-gray-400",
                "focus:outline-none focus:border-pc-olive focus:bg-white focus:shadow-md",
                "transition-all duration-300 ease-out",
                "hover:border-gray-300 hover:bg-white/80"
              )}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Mobile Search Button */}
          <button
            onClick={onSearchClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-pc-navy" />
          </button>

          {/* Recipe Box / Bookmarks */}
          <Link
            href="/recipes?tab=saved"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-pc-navy"
          >
            <Bookmark className="h-5 w-5" />
            <span className="font-medium text-sm">Your Recipe Box</span>
          </Link>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-pc-olive text-white font-semibold text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-pc-text-light">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/api/oauth/callback">
              <button className="px-4 py-2 rounded-lg bg-pc-olive text-white hover:bg-pc-olive/90 transition-colors font-medium text-sm">
                Sign in
              </button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-pc-navy" />
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="hidden md:block border-t border-gray-200/50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center h-12">
            <div className="flex items-center gap-6 px-4 py-2 bg-gradient-to-r from-gray-50/80 to-gray-50/60 rounded-xl border border-gray-200/60 backdrop-blur-sm shadow-sm">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === '/' && pathname === '/') ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "text-sm font-semibold transition-all duration-300 relative py-2 px-4 rounded-lg",
                      isActive
                        ? "text-pc-olive bg-white shadow-md scale-105"
                        : "text-pc-navy hover:text-pc-olive hover:bg-white/70 hover:scale-105"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

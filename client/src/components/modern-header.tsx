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
import { ThemeToggle } from '@/components/web3/ThemeToggle';

export function ModernHeader({
  onMenuClick,
  onSearchClick,
}: {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}) {
  const pathname = usePathname();
  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const [searchFocused, setSearchFocused] = useState(false);

  const navigation = [
    { name: 'Recipes', href: '/recipes', icon: null },
    { name: 'Ingredients', href: '/ingredients', icon: null },
    { name: 'Shopping Lists', href: '/shopping-lists', icon: null },
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
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

  return (
    <header className="w-full">
      {/* Banner-Style Header - Single Horizontal Bar */}
      <div className="flex h-16 md:h-20 items-center gap-4 md:gap-6 px-4 md:px-6 lg:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 group flex-shrink-0">
          <div className="bg-pc-olive p-2 md:p-2.5 rounded-lg transition-transform group-hover:scale-105">
            <ChefHat className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <span className="font-bold text-xl md:text-2xl gradient-text dark:neon-text group-hover:scale-105 transition-all duration-300 tracking-tight">
            Sous
          </span>
        </Link>

        {/* Center: Navigation Menu - Desktop Only */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 max-w-2xl mx-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={cn(
                  "relative px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-medium transition-all duration-200",
                  isActive
                    ? "text-pc-olive bg-pc-olive/10 dark:bg-pc-olive/20"
                    : "text-gray-700 dark:text-gray-300 hover:text-pc-olive hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                )}
                suppressHydrationWarning
              >
                {item.name}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pc-olive" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Center: Search Bar - Desktop Only (between nav and actions) */}
        <div className="hidden xl:block flex-1 max-w-md mx-4">
          <div
            className={cn(
              "relative group",
              searchFocused && "ring-2 ring-pc-olive/20 rounded-lg"
            )}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onClick={onSearchClick}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700",
                "bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm",
                "focus:outline-none focus:border-pc-olive focus:bg-white dark:focus:bg-gray-800 focus:shadow-sm",
                "transition-all duration-200",
                "hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800"
              )}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-auto">
          {/* Mobile/Tablet Search Button */}
          <button
            onClick={onSearchClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors xl:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Recipe Box / Bookmarks - Desktop Only */}
          <Link
            href="/recipes?tab=saved"
            className="hidden lg:flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            <Bookmark className="h-5 w-5" />
            <span className="font-medium text-sm hidden xl:inline">Recipe Box</span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex items-center gap-2 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  suppressHydrationWarning
                >
                  <Avatar className="h-8 w-8 md:h-9 md:w-9">
                    <AvatarFallback className="bg-pc-olive text-white font-semibold text-xs" suppressHydrationWarning>
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
            <>
              {/* Placeholder avatar that matches exact dimensions to prevent layout shift */}
              <div 
                className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                suppressHydrationWarning
                aria-hidden="true"
              />
              {!isLoadingUser && (
                <Link href="/api/oauth/callback">
                  <button className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg bg-pc-olive text-white hover:bg-pc-olive/90 transition-colors font-medium text-sm">
                    Sign in
                  </button>
                </Link>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
}

/*
  Modern Header Component
  Clean, simple header inspired by modern cooking sites
*/

"use client";
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ChefHat,
  Search,
  Bookmark,
  User,
  LogOut,
  Bell,
  MessageSquare,
  Home,
  BookOpen,
  Apple,
  ShoppingCart,
  Menu,
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
import { NotificationDropdown } from '@/components/NotificationDropdown';

export function ModernHeader({
  onSearchClick,
  onMenuClick,
}: {
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}) {
  const [location] = useLocation();
  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: unreadMessageCount } = trpc.messages.getUnreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });
  const [searchFocused, setSearchFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [pathname, setPathname] = useState('/');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setPathname(location);
    }
  }, [location]);

  const canShowAuthActions = isMounted && !isLoadingUser;

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Recipes', href: '/recipes', icon: BookOpen },
    { name: 'Ingredients', href: '/ingredients', icon: Apple },
    { name: 'Lists', href: '/shopping-lists', icon: ShoppingCart },
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
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* LinkedIn-Style Single Horizontal Bar */}
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-4 md:px-6 lg:px-8 max-w-full">
        {/* Left: Logo + Search Bar (LinkedIn Style) */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <div className="bg-pc-olive p-2 md:p-2.5 rounded transition-transform group-hover:scale-105">
              <ChefHat className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </Link>

          {/* Search Bar - Next to Logo */}
          <div className="hidden md:block w-64 lg:w-80">
            <div
              className={cn(
                "relative group",
                searchFocused && "ring-1 ring-[var(--russet-brown)]/30 rounded"
              )}
            >
              <input
                type="text"
                placeholder="I'm looking for..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onClick={onSearchClick}
                className={cn(
                  "w-full px-3 py-2 rounded-md border border-gray-300",
                  "bg-gray-50 text-[var(--russet-brown)] placeholder:text-gray-400 text-sm",
                  "focus:outline-none focus:border-[var(--russet-brown)] focus:bg-white",
                  "transition-all duration-200",
                  "hover:border-gray-400 hover:bg-white"
                )}
              />
            </div>
          </div>
        </div>

        {/* Center: Horizontal Navigation (Desktop only) */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center mx-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center px-3 lg:px-4 py-1.5 min-w-[64px] lg:min-w-[72px]",
                  "transition-colors duration-200 rounded-md",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  isActive && "bg-transparent"
                )}
                suppressHydrationWarning
              >
                <Icon 
                  className={cn(
                    "h-5 w-5 lg:h-6 lg:w-6 mb-0.5 transition-colors",
                    isActive 
                      ? "text-[var(--russet-brown)]" 
                      : "text-gray-600 dark:text-gray-400"
                  )} 
                />
                <span 
                  className={cn(
                    "text-xs font-medium leading-tight whitespace-nowrap transition-colors",
                    isActive 
                      ? "text-[var(--russet-brown)] border-b-2 border-[var(--russet-brown)] pb-0.5" 
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions - Upper right on web */}
        <div className="flex items-center gap-2 md:gap-3 lg:gap-4 flex-shrink-0 ml-auto">
          {/* Mobile/Tablet Search Button - Hidden on desktop */}
          <button
            onClick={onSearchClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-[var(--russet-brown)]" />
          </button>

          {/* Mobile/Tablet Menu Button - Hidden on desktop */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-[var(--russet-brown)]" />
          </button>

          {/* Mobile/Tablet: User avatar or sign in - Hidden on desktop */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <button
                onClick={onMenuClick}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                suppressHydrationWarning
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-pc-olive text-white font-semibold text-sm" suppressHydrationWarning>
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            ) : (
              canShowAuthActions && (
                <Link href="/api/oauth/callback">
                  <button className="px-3 py-1.5 rounded-lg bg-pc-olive text-white hover:bg-pc-olive/90 transition-colors font-medium text-sm">
                    Sign in
                  </button>
                </Link>
              )
            )}
          </div>

          {/* Desktop: All actions in upper right - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Secondary Actions */}
            {user && (
              <>
                {/* Notifications */}
                <NotificationDropdown />

                {/* Messages */}
                <Link href="/messages">
                  <button 
                    className="relative flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                    aria-label="Messages"
                  >
                    <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    {unreadMessageCount !== undefined && unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </button>
                </Link>
              </>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center justify-center">
              <ThemeToggle className="h-8 w-8" />
            </div>

            {/* User Menu / Profile */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700" 
                    suppressHydrationWarning
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-pc-olive text-white font-semibold text-sm" suppressHydrationWarning>
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-[var(--russet-brown)]">{user.name || 'User'}</p>
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
                {canShowAuthActions && (
                  <Link href="/api/oauth/callback">
                    <button className="px-4 py-2 rounded-lg bg-pc-olive text-white hover:bg-pc-olive/90 transition-colors font-medium text-sm border border-pc-olive">
                      Sign in
                    </button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

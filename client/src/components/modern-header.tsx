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
  LogOut,
  Bell,
  MessageSquare,
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
  onSearchClick,
}: {
  onSearchClick?: () => void;
}) {
  const pathname = usePathname();
  const { data: user, isLoading: isLoadingUser } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const [searchFocused, setSearchFocused] = useState(false);

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

        {/* Right: Actions - Navigation moved to sidebar on desktop, bottom nav on mobile */}
        <div className="flex items-center gap-1 md:gap-2 lg:gap-4 flex-1 justify-end ml-auto">
          {/* Mobile Search Button */}
          <button
            onClick={onSearchClick}
            className="md:hidden p-2 rounded hover:bg-gray-100 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-[var(--russet-brown)]" />
          </button>

          {/* Secondary Actions */}
          {user && (
            <>
              {/* Notifications (Optional) */}
              <button 
                className="hidden lg:flex flex-col items-center justify-center px-3 py-1.5 min-w-[64px] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6 mb-0.5 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Alerts</span>
              </button>

              {/* Messages (Optional) */}
              <button 
                className="hidden xl:flex flex-col items-center justify-center px-3 py-1.5 min-w-[64px] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Messages"
              >
                <MessageSquare className="h-5 w-5 md:h-6 md:w-6 mb-0.5 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Messages</span>
              </button>
            </>
          )}

          {/* Theme Toggle - Icon Only */}
          <div className="hidden sm:flex items-center justify-center px-2">
            <ThemeToggle className="h-8 w-8" />
          </div>

          {/* User Menu / Profile */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="flex flex-col items-center justify-center px-2 md:px-3 py-1.5 min-w-[64px] md:min-w-[72px] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  suppressHydrationWarning
                >
                  <Avatar className="h-6 w-6 md:h-7 md:w-7 mb-0.5">
                    <AvatarFallback className="bg-pc-olive text-white font-semibold text-xs" suppressHydrationWarning>
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "text-xs font-medium leading-tight transition-colors",
                    pathname.startsWith('/settings') || pathname.startsWith('/profile')
                      ? "text-[var(--russet-brown)] border-b-2 border-[var(--russet-brown)] pb-0.5"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    Me
                  </span>
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
              {/* Placeholder avatar for layout stability */}
              <div 
                className="h-6 w-6 md:h-7 md:w-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"
                suppressHydrationWarning
                aria-hidden="true"
              />
              {!isLoadingUser && (
                <Link href="/api/oauth/callback" className="ml-2">
                  <button className="px-3 md:px-4 py-1.5 md:py-2 rounded-md bg-pc-olive text-white hover:bg-pc-olive/90 transition-colors font-medium text-xs md:text-sm">
                    Sign in
                  </button>
                </Link>
              )}
            </>
          )}

        </div>
      </div>
    </header>
  );
}

/*
  Modern App-Style Menu Components
  Popular app menu patterns: bottom nav, sidebar, tabs, badges
*/

"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  BookOpen, 
  ShoppingCart, 
  Apple, 
  User, 
  Settings, 
  Bell,
  ChefHat,
  Plus,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

/* -------------------------------------------------------------------------- */
/* ------------------------- Bottom Navigation Bar ------------------------- */
/* -------------------------------------------------------------------------- */

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  
  const navItems = [
    { 
      name: 'Home', 
      href: '/', 
      icon: Home,
      badge: null
    },
    { 
      name: 'Recipes', 
      href: '/recipes', 
      icon: BookOpen,
      badge: null
    },
    { 
      name: 'Ingredients', 
      href: '/ingredients', 
      icon: Apple,
      badge: null
    },
    { 
      name: 'Lists', 
      href: '/shopping-lists', 
      icon: ShoppingCart,
      badge: null
    },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-pc-tan/20",
      "md:hidden", // Only show on mobile
      className
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href as any}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full relative",
                "transition-all duration-200",
                isActive ? "text-pc-olive" : "text-pc-text-light"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-pc-olive rounded-b-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className={cn(
                "relative p-2 rounded-xl transition-all",
                isActive && "bg-pc-olive/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
                
                {/* Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive ? "text-pc-olive scale-105" : "text-pc-text-light"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Modern Sidebar Menu --------------------------- */
/* -------------------------------------------------------------------------- */

export function ModernSidebar({ 
  collapsed = false,
  onToggle
}: { 
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const { data: user } = trpc.auth.me.useQuery();
  
  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: Home,
      badge: null,
      section: 'main'
    },
    { 
      name: 'My Ingredients', 
      href: '/ingredients', 
      icon: Apple,
      badge: null,
      section: 'main'
    },
    { 
      name: 'Find Recipes', 
      href: '/recipes', 
      icon: BookOpen,
      badge: null,
      section: 'main'
    },
    { 
      name: 'Shopping Lists', 
      href: '/shopping-lists', 
      icon: ShoppingCart,
      badge: null,
      section: 'main'
    },
  ];

  const bottomItems = [
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings,
      badge: null
    },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: Bell,
      badge: 2
    },
  ];

  return (
    <aside className={cn(
      "bg-white border-r border-pc-tan/10 h-full flex flex-col transition-all duration-300",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-pc-tan/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-pc-olive p-2 rounded-lg">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-pc-navy text-sm">Kitchen</div>
              <div className="text-xs text-pc-text-light">Companion</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="bg-pc-olive p-2 rounded-lg">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-pc-tan/20 transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href as any}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative",
                "hover:bg-pc-tan/20",
                isActive && "bg-pc-olive/10 text-pc-olive"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-pc-olive rounded-r-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                isActive 
                  ? "bg-pc-olive text-white shadow-lg shadow-pc-olive/20" 
                  : "bg-pc-tan/30 text-pc-navy group-hover:bg-pc-tan/40"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                </div>
              )}
              
              {/* Badge */}
              {item.badge && !collapsed && (
                <span className="flex-shrink-0 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-pc-tan/10 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href as any}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-pc-tan/20",
                isActive && "bg-pc-olive/10 text-pc-olive"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all relative",
                isActive 
                  ? "bg-pc-olive text-white" 
                  : "bg-pc-tan/30 text-pc-navy group-hover:bg-pc-tan/40"
              )}>
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                </div>
              )}
            </Link>
          );
        })}
        
        {/* User Profile */}
        {user && !collapsed && (
          <div className="mt-3 pt-3 border-t border-pc-tan/10">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-pc-tan/10">
              <div className="w-10 h-10 rounded-full bg-pc-olive/20 flex items-center justify-center">
                <User className="h-5 w-5 text-pc-olive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-pc-navy truncate">
                  {user.name || user.email || 'User'}
                </div>
                <div className="text-xs text-pc-text-light">View Profile</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Tab Navigation -------------------------------- */
/* -------------------------------------------------------------------------- */

export function TabNav({
  tabs,
  activeTab,
  onChange,
  className
}: {
  tabs: Array<{ id: string; label: string; icon?: React.ElementType; badge?: number }>;
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex gap-1 bg-pc-tan/10 p-1 rounded-xl",
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              "text-sm font-medium",
              isActive 
                ? "bg-white text-pc-navy shadow-sm" 
                : "text-pc-text-light hover:text-pc-navy"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            
            {tab.badge && (
              <span className="ml-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {tab.badge}
              </span>
            )}
            
            {isActive && (
              <motion.div
                layoutId="tabActive"
                className="absolute inset-0 bg-white rounded-lg -z-10"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Floating Action Button ------------------------- */
/* -------------------------------------------------------------------------- */

export function FloatingActionButton({
  icon: Icon = Plus,
  onClick,
  label,
  className
}: {
  icon?: React.ElementType;
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-6 z-40",
        "h-14 w-14 rounded-full bg-pc-olive text-white shadow-lg",
        "flex items-center justify-center",
        "hover:bg-pc-olive/90 hover:shadow-xl transition-all",
        "md:bottom-6",
        className
      )}
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Mobile Menu Drawer ----------------------------- */
/* -------------------------------------------------------------------------- */

export function MobileMenuDrawer({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: user } = trpc.auth.me.useQuery();
  
  const menuItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'My Ingredients', href: '/ingredients', icon: Apple },
    { name: 'Find Recipes', href: '/recipes', icon: BookOpen },
    { name: 'Shopping Lists', href: '/shopping-lists', icon: ShoppingCart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
          />
          
          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl md:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-pc-tan/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-pc-olive p-2 rounded-lg">
                    <ChefHat className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-pc-navy">Sous</div>
                    <div className="text-xs text-pc-text-light">Menu</div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-pc-tan/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href as any}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        isActive 
                          ? "bg-pc-olive/10 text-pc-olive" 
                          : "hover:bg-pc-tan/20 text-pc-navy"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isActive 
                          ? "bg-pc-olive text-white" 
                          : "bg-pc-tan/30"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Section */}
              {user && (
                <div className="p-4 border-t border-pc-tan/10">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-pc-tan/10">
                    <div className="w-10 h-10 rounded-full bg-pc-olive/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-pc-olive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-pc-navy truncate">
                        {user.name || user.email || 'User'}
                      </div>
                      <div className="text-xs text-pc-text-light">View Profile</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* ------------------------- Breadcrumb Navigation ------------------------- */
/* -------------------------------------------------------------------------- */

export function BreadcrumbNav({
  items
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex items-center gap-2 text-sm text-pc-text-light mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link
              href={item.href as any}
              className="hover:text-pc-olive transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-pc-navy font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span className="text-pc-tan/40">/</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}


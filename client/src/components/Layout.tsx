"use client";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BottomNav, ModernSidebar, MobileMenuDrawer } from './modern-menu';
import { ModernHeader } from './modern-header';

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  return (
    <div className="min-h-screen flex flex-col bg-pc-bg">
      {/* Header Section - Visually Defined */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-gray-200 shadow-lg">
        <ModernHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          onSearchClick={() => {
            if (typeof window !== 'undefined' && (window as any).__openCommandPalette) {
              (window as any).__openCommandPalette();
            }
          }}
        />
      </div>
      {/* Main Content */}
      <main className={cn(
        "flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 transition-all duration-300",
        "pb-20 md:pb-6" // Extra padding for bottom nav on mobile
      )}>
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      
      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer 
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}

"use client";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MobileMenuDrawer, BottomNav } from './modern-menu';
import { AnimatedBackground } from './web3';
import { ModernHeader } from './modern-header';

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Web 3.0 Animated Background */}
      <AnimatedBackground variant="gradient" intensity="low" />
      
      {/* Header Section - LinkedIn Style */}
      <ModernHeader
        onSearchClick={() => {
          if (typeof window !== 'undefined' && (window as any).__openCommandPalette) {
            (window as any).__openCommandPalette();
          }
        }}
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar - Hidden since navigation is now in header */}
        {/* Sidebar removed - using horizontal navigation in header on desktop */}

        {/* Main Content Area */}
        <main id="main-content" className={cn(
          "flex-1 w-full transition-all duration-300 relative z-10",
          // Mobile: compact padding
          "p-4",
          // Tablet: more breathing room
          "md:p-6",
          // Desktop: generous padding
          "lg:p-8",
          // Extra large: maximum comfort
          "xl:px-12 xl:py-10"
        )}>
          {/* Content wrapper with responsive max-width */}
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Drawer - Settings and profile on mobile */}
      <MobileMenuDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Bottom Navigation - Vertical icon navigation on mobile */}
      <BottomNav />
    </div>
  );
}

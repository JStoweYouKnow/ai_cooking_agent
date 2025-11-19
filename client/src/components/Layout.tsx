"use client";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BottomNav, ModernSidebar, MobileMenuDrawer } from './modern-menu';
import { ModernHeader } from './modern-header';
import { AnimatedBackground } from './web3';

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Web 3.0 Animated Background */}
      <AnimatedBackground variant="gradient" intensity="low" />
      
      {/* Header Section with Glass Effect */}
      <div className="sticky top-0 z-50 glass dark:glass-dark border-b border-gray-200/50 dark:border-white/10 shadow-lg backdrop-blur-xl">
        <ModernHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          onSearchClick={() => {
            if (typeof window !== 'undefined' && (window as any).__openCommandPalette) {
              (window as any).__openCommandPalette();
            }
          }}
        />
      </div>

      {/* Main Layout Container */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar - Hidden on mobile/tablet */}
        <div className="hidden lg:block lg:flex-shrink-0">
          <div className="sticky top-[180px] h-[calc(100vh-180px)]">
            <ModernSidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 w-full transition-all duration-300 relative z-10",
          // Mobile: compact padding with bottom nav space
          "p-4 pb-20",
          // Tablet: more breathing room
          "md:p-6 md:pb-6",
          // Desktop with sidebar: generous padding
          "lg:p-8 lg:pb-8",
          // Extra large: maximum comfort
          "xl:px-12 xl:py-10"
        )}>
          {/* Content wrapper with responsive max-width */}
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <BottomNav />

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}

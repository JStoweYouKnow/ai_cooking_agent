"use client";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BottomNav, ModernSidebar, MobileMenuDrawer } from './modern-menu';
import { ModernHeader } from './modern-header';

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pc-bg via-white to-pc-tan/5">
      {/* Header Section */}
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
          "flex-1 w-full transition-all duration-300",
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

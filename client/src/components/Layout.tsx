 "use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChefHat, Home, ShoppingCart, BookOpen, Apple, User, LogOut } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Ingredients', href: '/ingredients', icon: Apple },
    { name: 'Find Recipes', href: '/recipes', icon: BookOpen },
    { name: 'Shopping Lists', href: '/shopping-lists', icon: ShoppingCart },
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg shadow-md">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                AI Cooking Agent
              </span>
            </div>

            <nav className="hidden md:flex gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={`gap-2 transition-all ${
                        isActive 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md' 
                          : 'hover:bg-orange-50 text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{user.name || user.email || 'User'}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white/90 backdrop-blur-sm border-t border-orange-100 fixed bottom-0 inset-x-0 z-50 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around py-2 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'text-orange-600 bg-orange-50 shadow-sm' 
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-orange-100 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Built with AI-powered recipe discovery and ingredient management
          </p>
        </div>
      </footer>
    </div>
  );
}

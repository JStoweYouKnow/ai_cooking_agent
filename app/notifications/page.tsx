"use client";
import { PCCard, PCButton } from '@/components/project-comfort-ui';
import { PCEmpty } from '@/components/cooking-theme';
import { Bell, Check, X, ChefHat, Star, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  // For now, we'll show an empty state since there's no notification system yet
  // This can be expanded later with actual notifications from the database
  
  const notifications: Array<{
    id: string;
    type: 'recipe' | 'shopping' | 'ingredient' | 'system';
    title: string;
    message: string;
    time: string;
    read: boolean;
    actionUrl?: string;
  }> = []; // Empty for now

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pc-navy">Notifications</h1>
          <p className="mt-2 text-pc-text-light">
            Stay updated with your cooking activities
          </p>
        </div>
        {notifications.length > 0 && (
          <PCButton className="gap-2">
            <Check className="h-4 w-4" />
            Mark all as read
          </PCButton>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <PCEmpty
          title="No notifications yet"
          subtitle="When you have recipe updates, shopping list reminders, or other activity, they'll appear here"
          cta={
            <div className="flex gap-3">
              <Link href="/recipes">
                <PCButton className="gap-2">
                  <ChefHat className="h-4 w-4" />
                  Browse Recipes
                </PCButton>
              </Link>
              <Link href="/shopping-lists">
                <PCButton className="gap-2 bg-pc-tan text-pc-navy hover:bg-pc-tan/80">
                  <ShoppingCart className="h-4 w-4" />
                  View Lists
                </PCButton>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <PCCard
              key={notification.id}
              className={cn(
                "p-4 transition-all cursor-pointer hover:shadow-pc-lg",
                !notification.read && "bg-pc-olive/5 border-pc-olive/20"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  notification.type === 'recipe' && "bg-blue-100 text-blue-600",
                  notification.type === 'shopping' && "bg-purple-100 text-purple-600",
                  notification.type === 'ingredient' && "bg-green-100 text-green-600",
                  notification.type === 'system' && "bg-pc-tan/30 text-pc-olive"
                )}>
                  {notification.type === 'recipe' && <ChefHat className="h-5 w-5" />}
                  {notification.type === 'shopping' && <ShoppingCart className="h-5 w-5" />}
                  {notification.type === 'ingredient' && <Star className="h-5 w-5" />}
                  {notification.type === 'system' && <Bell className="h-5 w-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-pc-navy mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-pc-text-light">
                        {notification.message}
                      </p>
                      <p className="text-xs text-pc-text-light mt-2">
                        {notification.time}
                      </p>
                    </div>
                    
                    {!notification.read && (
                      <div className="flex-shrink-0 w-2 h-2 bg-pc-olive rounded-full" />
                    )}
                  </div>
                </div>
                
                <button
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-pc-tan/20 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4 text-pc-text-light" />
                </button>
              </div>
            </PCCard>
          ))}
        </div>
      )}

      {/* Info Card */}
      <PCCard className="bg-gradient-to-br from-pc-tan/10 to-pc-olive/5 border-pc-olive/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-pc-olive/10">
            <Bell className="h-5 w-5 text-pc-olive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-pc-navy mb-2">About Notifications</h3>
            <p className="text-sm text-pc-text-light mb-3">
              You'll receive notifications for:
            </p>
            <ul className="text-sm text-pc-text-light space-y-1 list-disc list-inside">
              <li>New recipe suggestions based on your pantry</li>
              <li>Shopping list reminders</li>
              <li>Ingredient expiration alerts</li>
              <li>Recipe favorites and updates</li>
            </ul>
          </div>
        </div>
      </PCCard>
    </div>
  );
}


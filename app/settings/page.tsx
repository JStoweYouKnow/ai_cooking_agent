"use client";

import { User, Bell, Shield, Palette, Database, LogOut, Upload } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Link from 'next/link';
import { PCCard } from '@/components/pc-card';
import { PCButton } from '@/components/pc-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-pc-navy">Settings</h1>
        <p className="mt-2 text-pc-text-light">
          Manage your account preferences and app settings
        </p>
      </div>

      {/* Profile Settings */}
      <PCCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-pc-olive/10">
            <User className="h-5 w-5 text-pc-olive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-pc-navy">Profile</h2>
            <p className="text-sm text-pc-text-light">Your account information</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              defaultValue={user?.name || ''}
              placeholder="Your name"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email || ''}
              placeholder="your@email.com"
              className="mt-2"
              disabled
            />
            <p className="text-xs text-pc-text-light mt-1">Email cannot be changed</p>
          </div>
          <PCButton className="gap-2">
            Save Changes
          </PCButton>
        </div>
      </PCCard>

      {/* Notification Settings */}
      <PCCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-100">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-pc-navy">Notifications</h2>
            <p className="text-sm text-pc-text-light">Manage how you receive updates</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Recipe Recommendations</Label>
              <p className="text-sm text-pc-text-light">Get notified about new recipe suggestions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Shopping List Reminders</Label>
              <p className="text-sm text-pc-text-light">Reminders for your shopping lists</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Ingredient Alerts</Label>
              <p className="text-sm text-pc-text-light">Notifications about ingredient updates</p>
            </div>
            <Switch />
          </div>
        </div>
      </PCCard>

      {/* Appearance Settings */}
      <PCCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-100">
            <Palette className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-pc-navy">Appearance</h2>
            <p className="text-sm text-pc-text-light">Customize the look and feel</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select defaultValue="light">
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="comfort">Comfort</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PCCard>

      {/* Data Management */}
      <PCCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-100">
            <Database className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-pc-navy">Data Management</h2>
            <p className="text-sm text-pc-text-light">Import and export your data</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Link href="/settings/import" passHref>
            <PCButton className="gap-2">
              <Upload className="h-4 w-4" />
              Import Recipes
            </PCButton>
          </Link>
          <PCButton className="gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50">
            <Database className="h-4 w-4" />
            Export My Data
          </PCButton>
        </div>
      </PCCard>

      {/* Privacy & Security */}
      <PCCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-red-100">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-pc-navy">Privacy & Security</h2>
            <p className="text-sm text-pc-text-light">Manage your data and security</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Data Collection</Label>
              <p className="text-sm text-pc-text-light">Allow anonymous usage analytics</p>
            </div>
            <Switch />
          </div>
        </div>
      </PCCard>

      {/* Danger Zone */}
      <PCCard className="border-red-200 bg-red-50/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-red-100">
            <LogOut className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-600">Account Actions</h2>
            <p className="text-sm text-pc-text-light">Irreversible actions</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <PCButton
            onClick={handleLogout}
            className="gap-2 bg-red-600 hover:bg-red-700"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
          </PCButton>
        </div>
      </PCCard>
    </div>
  );
}



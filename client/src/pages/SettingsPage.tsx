"use client";
import { useState, useEffect } from 'react';
import {
  GlassCard,
  SectionHeader,
  PremiumButton,
  DecorativeBlob,
  GradientText
} from '@/components/premium-ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Plus, X, AlertCircle, Leaf } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COMMON_DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Fat',
  'Low-Sodium',
  'Halal',
  'Kosher',
  'Raw Food',
  'Whole30',
];

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Fish',
  'Eggs',
  'Dairy',
  'Soy',
  'Wheat',
  'Gluten',
  'Sesame',
  'Sulfites',
  'Mustard',
];

export default function SettingsPage() {
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customPreference, setCustomPreference] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');

  const { data: preferences, isLoading } = trpc.user.getPreferences.useQuery();
  const updatePreferencesMutation = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Preferences updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });

  useEffect(() => {
    if (preferences) {
      setDietaryPreferences(preferences.dietaryPreferences || []);
      setAllergies(preferences.allergies || []);
    }
  }, [preferences]);

  const handleTogglePreference = (preference: string) => {
    setDietaryPreferences(prev =>
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const handleToggleAllergy = (allergy: string) => {
    setAllergies(prev =>
      prev.includes(allergy)
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleAddCustomPreference = () => {
    if (customPreference.trim() && !dietaryPreferences.includes(customPreference.trim())) {
      setDietaryPreferences(prev => [...prev, customPreference.trim()]);
      setCustomPreference('');
    }
  };

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies(prev => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleRemovePreference = (preference: string) => {
    setDietaryPreferences(prev => prev.filter(p => p !== preference));
  };

  const handleRemoveAllergy = (allergy: string) => {
    setAllergies(prev => prev.filter(a => a !== allergy));
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate({
      dietaryPreferences,
      allergies,
    });
  };

  if (isLoading) {
    return (
      <div className="relative space-y-8 pb-16">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pc-olive mx-auto mb-4"></div>
          <p className="text-pc-text-light">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pb-16">
      {/* Background decorative elements */}
      <DecorativeBlob
        color="tan"
        position="top-right"
        size="lg"
        opacity={0.1}
      />
      <DecorativeBlob
        color="olive"
        position="bottom-left"
        size="md"
        opacity={0.08}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-pc-olive to-pc-olive/80 shadow-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <GradientText className="text-3xl font-bold">Settings</GradientText>
          <p className="text-pc-text-light mt-1">Manage your dietary preferences and allergies</p>
        </div>
      </div>

      {/* Dietary Preferences Section */}
      <GlassCard glow={false}>
        <SectionHeader
          icon={Leaf}
          title="Dietary Preferences"
          description="Select your dietary preferences to get personalized recipe recommendations"
        />
        <div className="mt-6 space-y-6">
          {/* Common Preferences */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Common Preferences</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {COMMON_DIETARY_PREFERENCES.map((pref) => (
                <div
                  key={pref}
                  className="flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-pc-tan/10"
                  style={{
                    borderColor: dietaryPreferences.includes(pref) ? 'var(--pc-olive)' : 'var(--pc-tan)',
                    backgroundColor: dietaryPreferences.includes(pref) ? 'var(--pc-olive)/10' : 'transparent',
                  }}
                  onClick={() => handleTogglePreference(pref)}
                >
                  <Checkbox
                    checked={dietaryPreferences.includes(pref)}
                    onCheckedChange={() => handleTogglePreference(pref)}
                  />
                  <Label className="cursor-pointer flex-1">{pref}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Preference Input */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Add Custom Preference</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Mediterranean Diet"
                value={customPreference}
                onChange={(e) => setCustomPreference(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomPreference();
                  }
                }}
                className="flex-1"
              />
              <PremiumButton
                onClick={handleAddCustomPreference}
                disabled={!customPreference.trim()}
                color="olive"
              >
                <Plus className="h-4 w-4" />
                Add
              </PremiumButton>
            </div>
          </div>

          {/* Selected Preferences */}
          {dietaryPreferences.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Selected Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryPreferences.map((pref) => (
                  <Badge
                    key={pref}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm bg-pc-olive/20 text-pc-navy border-pc-olive/40"
                  >
                    {pref}
                    <button
                      onClick={() => handleRemovePreference(pref)}
                      className="ml-2 hover:text-red-600 transition-colors"
                      aria-label={`Remove ${pref}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Allergies Section */}
      <GlassCard glow={false}>
        <SectionHeader
          icon={AlertCircle}
          title="Allergies & Intolerances"
          description="Select any allergies or food intolerances to avoid in recipe recommendations"
        />
        <div className="mt-6 space-y-6">
          {/* Common Allergies */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Common Allergies</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {COMMON_ALLERGIES.map((allergy) => (
                <div
                  key={allergy}
                  className="flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-red-50"
                  style={{
                    borderColor: allergies.includes(allergy) ? 'var(--red-500)' : 'var(--pc-tan)',
                    backgroundColor: allergies.includes(allergy) ? 'var(--red-500)/10' : 'transparent',
                  }}
                  onClick={() => handleToggleAllergy(allergy)}
                >
                  <Checkbox
                    checked={allergies.includes(allergy)}
                    onCheckedChange={() => handleToggleAllergy(allergy)}
                  />
                  <Label className="cursor-pointer flex-1">{allergy}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Allergy Input */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Add Custom Allergy</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Cinnamon"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAllergy();
                  }
                }}
                className="flex-1"
              />
              <PremiumButton
                onClick={handleAddCustomAllergy}
                disabled={!customAllergy.trim()}
                color="olive"
              >
                <Plus className="h-4 w-4" />
                Add
              </PremiumButton>
            </div>
          </div>

          {/* Selected Allergies */}
          {allergies.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Selected Allergies</Label>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="destructive"
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-800 border-red-300"
                  >
                    {allergy}
                    <button
                      onClick={() => handleRemoveAllergy(allergy)}
                      className="ml-2 hover:text-red-900 transition-colors"
                      aria-label={`Remove ${allergy}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <PremiumButton
          onClick={handleSave}
          disabled={updatePreferencesMutation.isPending}
          size="lg"
          color="olive"
          className="min-w-[200px]"
        >
          {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </PremiumButton>
      </div>
    </div>
  );
}


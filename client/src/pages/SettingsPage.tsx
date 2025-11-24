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
import { Settings, Plus, X, AlertCircle, Leaf, Target, TrendingUp, TrendingDown, Scale, Baby } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type GoalType = 'bulking' | 'weight_loss' | 'maintenance' | 'pregnancy' | null;

interface GoalData {
  type: GoalType;
  targetCalories?: number;
  targetProtein?: number; // for bulking
  targetWeightLossPerWeek?: number; // for weight_loss (in lbs)
  trimester?: number; // for pregnancy (1, 2, or 3)
}

export default function SettingsPage() {
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customPreference, setCustomPreference] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');
  const [goal, setGoal] = useState<GoalData>({ type: null });
  const [calorieBudget, setCalorieBudget] = useState<number | null>(null);

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
      if (preferences.goals) {
        setGoal(preferences.goals as GoalData);
      }
      setCalorieBudget(preferences.calorieBudget ?? null);
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
    const goalsData = goal.type ? goal : null;
    updatePreferencesMutation.mutate({
      dietaryPreferences,
      allergies,
      goals: goalsData,
      calorieBudget: calorieBudget,
    });
  };

  const handleGoalTypeChange = (type: string) => {
    if (type === 'none') {
      setGoal({ type: null });
    } else {
      setGoal({
        type: type as GoalType,
        targetCalories: goal.targetCalories,
        targetProtein: goal.targetProtein,
        targetWeightLossPerWeek: goal.targetWeightLossPerWeek,
        trimester: goal.trimester,
      });
    }
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

      {/* Goals Section */}
      <GlassCard glow={false}>
        <SectionHeader
          icon={Target}
          title="Health & Fitness Goals"
          description="Set your nutrition goals to get personalized recipe recommendations"
        />
        <div className="mt-6 space-y-6">
          {/* Goal Type Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Your Goal</Label>
            <Select
              value={goal.type || 'none'}
              onValueChange={handleGoalTypeChange}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="No specific goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific goal</SelectItem>
                <SelectItem value="bulking">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Bulking (Muscle Gain)</span>
                  </div>
                </SelectItem>
                <SelectItem value="weight_loss">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    <span>Weight Loss</span>
                  </div>
                </SelectItem>
                <SelectItem value="maintenance">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    <span>Weight Maintenance</span>
                  </div>
                </SelectItem>
                <SelectItem value="pregnancy">
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    <span>Pregnancy</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goal-Specific Fields */}
          {goal.type && (
            <div className="space-y-4 p-6 rounded-xl border-2 border-pc-olive/30 bg-gradient-to-br from-pc-olive/5 to-white">
              {/* Target Calories (for all goals) */}
              <div>
                <Label htmlFor="targetCalories" className="text-base font-semibold mb-2 block">
                  Target Daily Calories
                </Label>
                <Input
                  id="targetCalories"
                  type="number"
                  min="800"
                  max="5000"
                  step="50"
                  placeholder="e.g., 2000"
                  value={goal.targetCalories || ''}
                  onChange={(e) => setGoal({
                    ...goal,
                    targetCalories: e.target.value ? parseInt(e.target.value) : undefined,
                  })}
                  className="w-full md:w-64"
                />
                <p className="text-sm text-pc-text-light mt-1">
                  Recommended: 1,800-2,500 calories per day (varies by individual)
                </p>
              </div>

              {/* Bulking-specific: Target Protein */}
              {goal.type === 'bulking' && (
                <div>
                  <Label htmlFor="targetProtein" className="text-base font-semibold mb-2 block">
                    Target Daily Protein (grams)
                  </Label>
                  <Input
                    id="targetProtein"
                    type="number"
                    min="50"
                    max="300"
                    step="10"
                    placeholder="e.g., 150"
                    value={goal.targetProtein || ''}
                    onChange={(e) => setGoal({
                      ...goal,
                      targetProtein: e.target.value ? parseInt(e.target.value) : undefined,
                    })}
                    className="w-full md:w-64"
                  />
                  <p className="text-sm text-pc-text-light mt-1">
                    Recommended: 1.6-2.2g per kg of body weight for muscle gain
                  </p>
                </div>
              )}

              {/* Weight Loss-specific: Target Weight Loss Per Week */}
              {goal.type === 'weight_loss' && (
                <div>
                  <Label htmlFor="targetWeightLoss" className="text-base font-semibold mb-2 block">
                    Target Weight Loss Per Week (lbs)
                  </Label>
                  <Input
                    id="targetWeightLoss"
                    type="number"
                    min="0.5"
                    max="3"
                    step="0.5"
                    placeholder="e.g., 1.5"
                    value={goal.targetWeightLossPerWeek || ''}
                    onChange={(e) => setGoal({
                      ...goal,
                      targetWeightLossPerWeek: e.target.value ? parseFloat(e.target.value) : undefined,
                    })}
                    className="w-full md:w-64"
                  />
                  <p className="text-sm text-pc-text-light mt-1">
                    Recommended: 1-2 lbs per week for sustainable weight loss
                  </p>
                </div>
              )}

              {/* Pregnancy-specific: Trimester */}
              {goal.type === 'pregnancy' && (
                <div>
                  <Label htmlFor="trimester" className="text-base font-semibold mb-2 block">
                    Current Trimester
                  </Label>
                  <Select
                    value={goal.trimester?.toString() || ''}
                    onValueChange={(value) => setGoal({
                      ...goal,
                      trimester: parseInt(value),
                    })}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select trimester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Trimester (0-13 weeks)</SelectItem>
                      <SelectItem value="2">Second Trimester (14-27 weeks)</SelectItem>
                      <SelectItem value="3">Third Trimester (28+ weeks)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-pc-text-light mt-1">
                    Calorie needs increase by ~300-500 calories per day during pregnancy
                  </p>
                </div>
              )}

              {/* Goal Summary */}
              <div className="pt-4 border-t border-pc-tan/20">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-pc-olive/10 border border-pc-olive/20">
                  <Target className="h-5 w-5 text-pc-olive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-pc-navy mb-1">
                      {goal.type === 'bulking' && 'Bulking Goal'}
                      {goal.type === 'weight_loss' && 'Weight Loss Goal'}
                      {goal.type === 'maintenance' && 'Maintenance Goal'}
                      {goal.type === 'pregnancy' && 'Pregnancy Goal'}
                    </p>
                    <div className="text-sm text-pc-text-light space-y-1">
                      {goal.targetCalories && (
                        <p>Target Calories: <span className="font-medium">{goal.targetCalories} kcal/day</span></p>
                      )}
                      {goal.type === 'bulking' && goal.targetProtein && (
                        <p>Target Protein: <span className="font-medium">{goal.targetProtein}g/day</span></p>
                      )}
                      {goal.type === 'weight_loss' && goal.targetWeightLossPerWeek && (
                        <p>Target Weight Loss: <span className="font-medium">{goal.targetWeightLossPerWeek} lbs/week</span></p>
                      )}
                      {goal.type === 'pregnancy' && goal.trimester && (
                        <p>Trimester: <span className="font-medium">{goal.trimester === 1 ? 'First' : goal.trimester === 2 ? 'Second' : 'Third'}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Calorie Budget Section */}
      <GlassCard glow={false}>
        <SectionHeader
          icon={Target}
          title="Daily Calorie Budget"
          description="Set your daily calorie budget to get meal recommendations that fit your goals"
        />
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="calorieBudget" className="text-base font-semibold mb-3 block">
              Daily Calorie Budget (kcal)
            </Label>
            <Input
              id="calorieBudget"
              type="number"
              min="800"
              max="5000"
              step="50"
              placeholder="e.g., 2000"
              value={calorieBudget || ''}
              onChange={(e) => setCalorieBudget(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full md:w-96"
            />
            <p className="text-sm text-pc-text-light mt-2">
              This budget will be used to filter recipe recommendations. 
              {goal.type && goal.targetCalories && (
                <span className="block mt-1">
                  Your goal target: <span className="font-semibold">{goal.targetCalories} kcal/day</span>
                  {calorieBudget && calorieBudget !== goal.targetCalories && (
                    <span className="text-pc-olive"> (You can override this with a custom budget)</span>
                  )}
                </span>
              )}
            </p>
            {calorieBudget && (
              <div className="mt-4 p-4 rounded-lg bg-pc-olive/10 border border-pc-olive/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-pc-olive" />
                  <span className="font-semibold text-pc-navy">Budget Allocation</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-pc-text-light">Breakfast:</span>
                    <span className="font-medium ml-2">{Math.floor(calorieBudget * 0.25)} kcal</span>
                  </div>
                  <div>
                    <span className="text-pc-text-light">Lunch:</span>
                    <span className="font-medium ml-2">{Math.floor(calorieBudget * 0.35)} kcal</span>
                  </div>
                  <div>
                    <span className="text-pc-text-light">Dinner:</span>
                    <span className="font-medium ml-2">{Math.floor(calorieBudget * 0.35)} kcal</span>
                  </div>
                  <div>
                    <span className="text-pc-text-light">Dessert:</span>
                    <span className="font-medium ml-2">{Math.floor(calorieBudget * 0.05)} kcal</span>
                  </div>
                </div>
              </div>
            )}
          </div>
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


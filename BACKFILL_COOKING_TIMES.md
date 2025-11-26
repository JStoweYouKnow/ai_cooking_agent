# Cooking Time Backfill Script

This script automatically extracts cooking times from existing recipes in your database that don't have a cooking time value.

## How It Works

The script:
1. Scans all recipes in your database
2. Identifies recipes without a cooking time but with instructions
3. Uses pattern matching to extract time information from the instructions
4. Updates the database with the extracted cooking times

## Pattern Recognition

The extraction function recognizes patterns like:
- `"bake for 30 minutes"`
- `"cook for 1 hour"`
- `"simmer 45 minutes at 350°F"`
- `"roast for 30-45 minutes"` (uses 45)
- `"grill for 1.5 hours"` (converts to 90 minutes)

## Usage

### Basic Run
```bash
npm run backfill-cooking-times
```

### Dry Run (Preview Only)
To see what would be updated without making changes:
```bash
npm run backfill-cooking-times -- --dry-run
```

### Verbose Mode
To see all recipes including those where no time was found:
```bash
npm run backfill-cooking-times -- --verbose
```

### Combine Options
```bash
npm run backfill-cooking-times -- --dry-run --verbose
```

## Example Output

```
🔍 Starting cooking time backfill process...

📊 Found 150 total recipes in database

🎯 50 recipes need cooking time extraction

⚙️  Processing recipes...

   ✓ "Classic Chocolate Chip Cookies" → 12 minutes
   ✓ "Slow Cooker Beef Stew" → 480 minutes
   ✓ "Quick Pasta Carbonara" → 15 minutes
   ...

📈 Extraction Results:
   ✅ Successfully extracted: 42
   ❌ Could not extract: 8

💾 Updating 42 recipes in database...

✅ Successfully updated 42 recipes!

📊 Summary:
   Total recipes in database: 150
   Recipes processed: 50
   Cooking times extracted: 42
   Unable to extract: 8
   Success rate: 84.0%

🎉 Backfill complete!

💡 Tip: Your recipes now have cooking times! They'll appear in recipe cards and search filters.
```

## When to Run This Script

- **After importing bulk recipes** - If you've imported recipes from external sources that may not include cooking time metadata
- **After database migration** - When moving from another system where cooking times weren't captured
- **Periodic maintenance** - Run occasionally to catch any recipes added without cooking times
- **One-time cleanup** - If you have historical recipes missing this field

## Safety Features

- ✅ **Non-destructive** - Only updates recipes that don't have a cooking time
- ✅ **Dry-run mode** - Preview changes before committing
- ✅ **Validation** - Rejects unrealistic times (max 24 hours)
- ✅ **Smart extraction** - Uses the longest time found (most likely total cook time)
- ✅ **Range handling** - For "30-45 minutes", uses the upper value (45)

## What Happens to Recipes Without Extractable Times?

Recipes where no cooking time can be extracted from the instructions will remain unchanged. Common reasons:
- Instructions don't mention specific cook times
- Instructions use vague terms like "cook until done"
- Recipe is for no-cook items (salads, smoothies, etc.)

You can manually add cooking times to these recipes through the UI or by updating them directly in the database.

## Technical Details

### Database Impact
- **Read operations**: Selects all recipes (id, name, instructions, cookingTime)
- **Write operations**: Updates only recipes where a cooking time was extracted
- **Batch processing**: Updates are performed individually (not in transactions)

### Performance
- Processing speed: ~10-50 recipes/second (depends on instruction length)
- Database load: Minimal (single SELECT, individual UPDATEs)
- Memory usage: Loads all recipes into memory at once

### Future Runs
Running the script multiple times is safe - it will skip recipes that already have cooking times and only process new ones.

## Troubleshooting

### "Database not available" Error
Ensure your `DATABASE_URL` environment variable is set correctly:
```bash
# Check your .env file
cat .env | grep DATABASE_URL
```

### Low Success Rate
If the script extracts times from fewer than expected recipes:
1. Run with `--verbose` to see which recipes failed
2. Check if instructions use non-standard time formats
3. Consider manually updating recipes with ambiguous instructions

### Script Hangs or Crashes
- Check your database connection
- Ensure you have enough memory for all recipes
- Try running on a subset by filtering in the code

## Integration with Recipe Parser

This script uses the same `extractCookingTimeFromInstructions()` function that the recipe URL parser uses. This means:

- **Consistent extraction** - Same logic for new and existing recipes
- **Automatic for new recipes** - Future imports will have cooking times extracted automatically
- **No duplicates** - The backfill won't re-extract times for recipes that already have them

## Advanced Usage

### Running Programmatically

You can import and use the function directly:

```typescript
import { backfillCookingTimes } from './scripts/backfill-cooking-times';

// Run in dry-run mode
const stats = await backfillCookingTimes(true);
console.log(`Extracted ${stats.success} cooking times`);
```

### Filtering Specific Recipes

Modify the script to process only certain recipes:

```typescript
// In backfill-cooking-times.ts, add a filter:
const recipesNeedingTime = allRecipes
  .filter(recipe => !recipe.cookingTime && recipe.instructions)
  .filter(recipe => recipe.userId === SPECIFIC_USER_ID); // Add custom filter
```

## See Also

- [Recipe Parsing Documentation](./server/_core/recipeParsing.ts)
- [Database Schema](./drizzle/schema-postgres.ts)
- [Recipe Router](./server/routers.ts)

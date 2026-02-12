import Database from 'better-sqlite3';

// Open the database
const db = new Database('./cooking_agent.db', { readonly: true });

console.log('\n=== INGREDIENT DIAGNOSIS ===\n');

// Get the most recent imported recipe
const recentRecipe = db.prepare(`
  SELECT id, name, source, ingredients
  FROM recipes
  WHERE source LIKE '%import%' OR sourceUrl IS NOT NULL
  ORDER BY createdAt DESC
  LIMIT 1
`).get();

if (!recentRecipe) {
  console.log('No imported recipes found');
  process.exit(0);
}

console.log(`Recipe ID: ${recentRecipe.id}`);
console.log(`Recipe Name: ${recentRecipe.name}`);
console.log(`Source: ${recentRecipe.source}`);
console.log('\n--- LAYER 1: DATABASE ---');
console.log('Ingredients column (JSONB):');
if (recentRecipe.ingredients) {
  try {
    const parsed = JSON.parse(recentRecipe.ingredients);
    console.log(JSON.stringify(parsed, null, 2));
    console.log(`\nTotal ingredients in JSONB: ${Array.isArray(parsed) ? parsed.length : 0}`);
  } catch (e) {
    console.log('ERROR parsing ingredients JSON:', e.message);
    console.log('Raw value:', recentRecipe.ingredients);
  }
} else {
  console.log('NULL (no ingredients in JSONB column)');
}

// Check junction table
console.log('\n--- LAYER 2: JUNCTION TABLE ---');
const junctionIngredients = db.prepare(`
  SELECT
    ri.id,
    ri.quantity,
    ri.unit,
    i.name as ingredientName
  FROM recipe_ingredients ri
  JOIN ingredients i ON ri.ingredientId = i.id
  WHERE ri.recipeId = ?
`).all(recentRecipe.id);

console.log(`Total ingredients in junction table: ${junctionIngredients.length}`);
if (junctionIngredients.length > 0) {
  junctionIngredients.forEach((ing, idx) => {
    console.log(`  ${idx + 1}. ${ing.ingredientName} (${ing.quantity || ''} ${ing.unit || ''})`);
  });
} else {
  console.log('  (none)');
}

console.log('\n--- RECOMMENDATION ---');
if (junctionIngredients.length > 0) {
  console.log('✓ Ingredients saved in junction table (correct for mobile app)');
} else if (recentRecipe.ingredients) {
  console.log('⚠️  Ingredients only in JSONB column, not in junction table');
  console.log('   Mobile app should fall back to JSONB, but check RecipeDetailScreen.tsx:147-169');
} else {
  console.log('❌ No ingredients found anywhere - parsing failed');
}

db.close();

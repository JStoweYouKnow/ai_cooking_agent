import fetch from 'node-fetch';

const url = 'https://cooking.nytimes.com/recipes/3044-cranberry-nut-bread';
console.log('Fetching:', url);

const res = await fetch(url);
const html = await res.text();

const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
let match;
let found = false;

while ((match = jsonLdRegex.exec(html)) !== null) {
  try {
    const json = JSON.parse(match[1]);

    // Check if it's a Recipe directly or in @graph
    let recipe = null;
    if (json['@type'] === 'Recipe') {
      recipe = json;
    } else if (Array.isArray(json['@graph'])) {
      recipe = json['@graph'].find(item => item['@type'] === 'Recipe');
    }

    if (recipe) {
      console.log('\n✓ Found Recipe JSON-LD');
      console.log('Recipe name:', recipe.name);
      console.log('Has recipeIngredient:', !!recipe.recipeIngredient);
      console.log('Is array:', Array.isArray(recipe.recipeIngredient));

      if (recipe.recipeIngredient) {
        console.log('Ingredients count:', recipe.recipeIngredient.length);
        console.log('\nFirst 5 ingredients:');
        recipe.recipeIngredient.slice(0, 5).forEach((ing, i) => {
          console.log(`  ${i + 1}. ${ing}`);
        });
      } else {
        console.log('⚠️  NO INGREDIENTS FOUND IN JSON-LD');
      }

      found = true;
      break;
    }
  } catch (e) {
    // Skip invalid JSON
  }
}

if (!found) {
  console.log('❌ No recipe JSON-LD found');
}

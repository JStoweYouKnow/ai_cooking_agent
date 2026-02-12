// Test the full parsing flow including the return value
import { parseRecipeFromUrl } from './server/_core/recipeParsing.ts';

const url = 'https://cooking.nytimes.com/recipes/3044-cranberry-nut-bread';
console.log('Testing full parse flow for:', url);
console.log('');

const parsed = await parseRecipeFromUrl(url);

console.log('Parsed result:');
console.log('  Name:', parsed?.name);
console.log('  Has description:', !!parsed?.description);
console.log('  Has instructions:', !!parsed?.instructions);
console.log('  Has ingredients:', !!parsed?.ingredients);

if (parsed?.ingredients) {
  console.log('  Ingredients count:', parsed.ingredients.length);
  console.log('');
  console.log('First 5 ingredients:');
  parsed.ingredients.slice(0, 5).forEach((ing, i) => {
    console.log(`  ${i + 1}. ${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim());
  });
} else {
  console.log('');
  console.log('⚠️  NO INGREDIENTS IN PARSED OBJECT!');
}

// Simulate what the tRPC mutation returns
console.log('');
console.log('What tRPC mutation would return:');
const response = { parsed };
console.log(JSON.stringify(response, null, 2));

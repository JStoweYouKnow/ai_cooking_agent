/**
 * Shopping list export functionality
 * Supports PDF, CSV, and plain text formats
 */

import type { ShoppingListItem, Ingredient } from 'drizzle/schema';

interface ShoppingListExportData {
  listName: string;
  listDescription?: string;
  items: Array<{
    ingredient: Ingredient;
    quantity?: string | null;
    unit?: string | null;
    isChecked: boolean;
  }>;
  createdAt: Date;
}

/**
 * Export shopping list as CSV
 */
export function exportAsCSV(data: ShoppingListExportData): string {
  const header = 'Ingredient,Quantity,Unit,Checked\n';
  const rows = data.items
    .map((item) => {
      const ingredient = escapeCSV(item.ingredient.name);
      const quantity = escapeCSV(item.quantity || '');
      const unit = escapeCSV(item.unit || '');
      const checked = item.isChecked ? 'Yes' : 'No';
      return `${ingredient},${quantity},${unit},${checked}`;
    })
    .join('\n');

  return `# ${data.listName}\n` +
    (data.listDescription ? `# ${data.listDescription}\n` : '') +
    `# Created: ${data.createdAt.toLocaleDateString()}\n\n` +
    header +
    rows;
}

/**
 * Export shopping list as plain text
 */
export function exportAsText(data: ShoppingListExportData): string {
  let output = `${data.listName}\n`;
  output += '='.repeat(data.listName.length) + '\n\n';

  if (data.listDescription) {
    output += `${data.listDescription}\n\n`;
  }

  output += `Created: ${data.createdAt.toLocaleDateString()}\n\n`;
  output += 'Shopping List:\n';
  output += '-'.repeat(50) + '\n\n';

  data.items.forEach((item, index) => {
    const checkbox = item.isChecked ? '[✓]' : '[ ]';
    const quantityUnit = [item.quantity, item.unit].filter(Boolean).join(' ');
    const quantityStr = quantityUnit ? ` (${quantityUnit})` : '';

    output += `${checkbox} ${index + 1}. ${item.ingredient.name}${quantityStr}\n`;
  });

  output += '\n' + '-'.repeat(50) + '\n';
  output += `Total items: ${data.items.length}\n`;
  output += `Checked: ${data.items.filter(i => i.isChecked).length}\n`;
  output += `Unchecked: ${data.items.filter(i => !i.isChecked).length}\n`;

  return output;
}

/**
 * Export shopping list as Markdown
 */
export function exportAsMarkdown(data: ShoppingListExportData): string {
  let output = `# ${data.listName}\n\n`;

  if (data.listDescription) {
    output += `${data.listDescription}\n\n`;
  }

  output += `**Created:** ${data.createdAt.toLocaleDateString()}\n\n`;
  output += `## Shopping List\n\n`;

  data.items.forEach((item) => {
    const checkbox = item.isChecked ? '[x]' : '[ ]';
    const quantityUnit = [item.quantity, item.unit].filter(Boolean).join(' ');
    const quantityStr = quantityUnit ? ` *(${quantityUnit})*` : '';

    output += `- ${checkbox} ${item.ingredient.name}${quantityStr}\n`;
  });

  output += `\n---\n\n`;
  output += `**Total items:** ${data.items.length} | `;
  output += `**Checked:** ${data.items.filter(i => i.isChecked).length} | `;
  output += `**Unchecked:** ${data.items.filter(i => !i.isChecked).length}\n`;

  return output;
}

/**
 * Export shopping list as JSON
 */
export function exportAsJSON(data: ShoppingListExportData): string {
  const exportData = {
    name: data.listName,
    description: data.listDescription,
    createdAt: data.createdAt.toISOString(),
    items: data.items.map(item => ({
      name: item.ingredient.name,
      category: item.ingredient.category,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.isChecked,
    })),
    summary: {
      total: data.items.length,
      checked: data.items.filter(i => i.isChecked).length,
      unchecked: data.items.filter(i => !i.isChecked).length,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Escape special characters for CSV
 */
function escapeCSV(value: string): string {
  if (!value) return '';

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: 'csv' | 'txt' | 'md' | 'json'): string {
  const mimeTypes = {
    csv: 'text/csv',
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
  };

  return mimeTypes[format];
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: 'csv' | 'txt' | 'md' | 'json'): string {
  return format;
}

/**
 * Main export function that routes to appropriate format
 */
export function exportShoppingList(
  data: ShoppingListExportData,
  format: 'csv' | 'txt' | 'md' | 'json'
): string {
  switch (format) {
    case 'csv':
      return exportAsCSV(data);
    case 'txt':
      return exportAsText(data);
    case 'md':
      return exportAsMarkdown(data);
    case 'json':
      return exportAsJSON(data);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

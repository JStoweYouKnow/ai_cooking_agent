/**
 * Shopping list export functionality
 * Supports PDF, CSV, and plain text formats
 */

import PDFDocument from 'pdfkit';
import type { ShoppingListItem, Ingredient } from '../../drizzle/schema-postgres';

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
 * Export shopping list as PDF
 */
export function exportAsPDF(data: ShoppingListExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text(data.listName, { align: 'center' });
      doc.moveDown(0.5);

      // Description
      if (data.listDescription) {
        doc.fontSize(12).font('Helvetica').fillColor('#666666')
          .text(data.listDescription, { align: 'center' });
        doc.moveDown(0.5);
      }

      // Date
      doc.fontSize(10).fillColor('#999999')
        .text(`Created: ${data.createdAt.toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1);

      // Divider
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#CCCCCC');
      doc.moveDown(1);

      // Shopping List Header
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Shopping List');
      doc.moveDown(0.5);

      // Items
      data.items.forEach((item, index) => {
        const checkbox = item.isChecked ? '☑' : '☐';
        const quantityUnit = [item.quantity, item.unit].filter(Boolean).join(' ');
        const quantityStr = quantityUnit ? ` (${quantityUnit})` : '';

        // Check if we need a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }

        const itemText = `${checkbox} ${index + 1}. ${item.ingredient.name}${quantityStr}`;
        const currentY = doc.y;

        doc.fontSize(11).font('Helvetica')
          .fillColor(item.isChecked ? '#999999' : '#000000')
          .text(itemText);

        // Draw strikethrough for checked items
        if (item.isChecked) {
          const textWidth = doc.widthOfString(itemText);
          doc.moveTo(50, currentY + 6)
            .lineTo(50 + textWidth, currentY + 6)
            .stroke('#999999');
        }

        doc.moveDown(0.3);
      });

      // Summary
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#CCCCCC');
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
      doc.text(`Total items: ${data.items.length} | ` +
               `Checked: ${data.items.filter(i => i.isChecked).length} | ` +
               `Unchecked: ${data.items.filter(i => !i.isChecked).length}`,
               { align: 'center' });

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').fillColor('#CCCCCC')
        .text('Generated by AI Cooking Agent', { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
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
export function getMimeType(format: 'csv' | 'txt' | 'md' | 'json' | 'pdf'): string {
  const mimeTypes = {
    csv: 'text/csv',
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    pdf: 'application/pdf',
  };

  return mimeTypes[format];
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: 'csv' | 'txt' | 'md' | 'json' | 'pdf'): string {
  return format;
}

/**
 * Main export function that routes to appropriate format
 */
export function exportShoppingList(
  data: ShoppingListExportData,
  format: 'csv' | 'txt' | 'md' | 'json' | 'pdf'
): string | Promise<Buffer> {
  switch (format) {
    case 'csv':
      return exportAsCSV(data);
    case 'txt':
      return exportAsText(data);
    case 'md':
      return exportAsMarkdown(data);
    case 'json':
      return exportAsJSON(data);
    case 'pdf':
      return exportAsPDF(data);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

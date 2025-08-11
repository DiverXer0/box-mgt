import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { type BoxWithItems } from '@shared/schema';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function exportBoxToPDF(box: BoxWithItems): Promise<void> {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(box.name, 20, 30);
    
    // Box info
    doc.setFontSize(12);
    doc.text(`Location: ${box.location}`, 20, 45);
    doc.text(`Description: ${box.description}`, 20, 55);
    doc.text(`Total Items: ${box.itemCount}`, 20, 65);
    doc.text(`Total Value: $${box.totalValue.toFixed(2)}`, 20, 75);
    doc.text(`Items with Receipts: ${box.withReceipts}`, 20, 85);
    
    // Items table
    if (box.items.length > 0) {
      const tableData = box.items.map(item => [
        item.name,
        item.quantity.toString(),
        item.details,
        item.value ? `$${(item.value * item.quantity).toFixed(2)}` : '-',
        item.receiptFilename ? 'Yes' : 'No'
      ]);

      doc.autoTable({
        startY: 100,
        head: [['Item Name', 'Quantity', 'Details', 'Total Value', 'Receipt']],
        body: tableData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [33, 150, 243] },
      });
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
    
    doc.save(`${box.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-contents.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF');
  }
}

export function exportBoxToCSV(box: BoxWithItems): void {
  try {
    const headers = ['Item Name', 'Quantity', 'Details', 'Unit Value', 'Total Value', 'Has Receipt', 'Receipt Filename'];
    
    const csvData = [
      headers,
      ...box.items.map(item => [
        `"${item.name.replace(/"/g, '""')}"`,
        item.quantity.toString(),
        `"${item.details.replace(/"/g, '""')}"`,
        item.value ? item.value.toFixed(2) : '',
        item.value ? (item.value * item.quantity).toFixed(2) : '',
        item.receiptFilename ? 'Yes' : 'No',
        item.receiptFilename || ''
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Add BOM for proper Excel UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${box.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-contents.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error('Failed to export CSV');
  }
}

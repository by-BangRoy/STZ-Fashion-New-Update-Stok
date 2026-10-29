import type { Product, StockLog } from '../types/inventory.ts';

/**
 * Escapes cell content for RFC 4180 CSV standard
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports products as a clean, structured, and beautiful CSV file.
 * Includes UTF-8 BOM (\uFEFF) and Windows CRLF so Microsoft Excel, Google Sheets,
 * and WPS Office open it directly with clean separated columns.
 */
export function exportInventoryToCSV(products: Product[], storeName: string = 'STZstok'): boolean {
  if (!products || products.length === 0) {
    console.warn('Katalog masih kosong, tidak ada data barang untuk diekspor.');
    return false;
  }

  // Exact download timestamp in local WIB format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const downloadTimeStr = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} WIB`;
  const fileDateTimeStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

  // Standar Kolom Rapi & Terstruktur
  const headers = [
    'No',
    'Nama Barang',
    'Kategori',
    'Warna',
    'Ukuran / Size',
    'Stok (Pcs)',
    'Stok (Lusin)',
    'Batas Min Stok (Pcs)',
    'Status Stok',
    'Waktu Unduh Data (Download)',
    'Terakhir Diperbarui'
  ];

  const rows: string[] = [];
  let rowNumber = 1;

  products.forEach((product) => {
    (product.variants || []).forEach((variant) => {
      const stockPcs = Number(variant.stock) || 0;
      const minStock = Number(variant.minStock) || 0;
      const lusinStr = `${(stockPcs / 12).toFixed(1).replace('.', ',')} Lsn`;

      let statusStok = 'AMAN';
      if (stockPcs === 0) {
        statusStok = 'HABIS';
      } else if (stockPcs <= minStock) {
        statusStok = 'MENIPIS';
      }

      const lastUpdated = product.updatedAt
        ? new Date(product.updatedAt).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }) + ' WIB'
        : '-';

      const row = [
        String(rowNumber++),
        escapeCsvCell(product.name),
        escapeCsvCell(product.category || 'Pakaian'),
        escapeCsvCell(variant.color || 'Standar'),
        escapeCsvCell(variant.size || 'All Size'),
        String(stockPcs),
        escapeCsvCell(lusinStr),
        String(minStock),
        statusStok,
        escapeCsvCell(downloadTimeStr),
        escapeCsvCell(lastUpdated)
      ];

      rows.push(row.join(','));
    });
  });

  const csvRows = [
    headers.map(escapeCsvCell).join(','),
    ...rows
  ];

  // UTF-8 BOM (\uFEFF) ensures Excel opens Indonesian characters and numbers neatly separated into columns
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanStoreName = (storeName || 'STZstok').trim().replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Stok_Inventaris_${cleanStoreName}_${fileDateTimeStr}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Sync and update CSV in server storage aligned with exact download time
  try {
    fetch('/api/inventory/save-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csvContent,
        filename,
        downloadTime: downloadTimeStr
      }),
    }).catch(() => {});
  } catch (e) {}
  return true;
}

/**
 * Exports Audit activity logs as clean CSV
 */
export function exportAuditLogsToCSV(logs: StockLog[]) {
  if (!logs || logs.length === 0) {
    console.warn('Belum ada catatan aktivitas riwayat stok.');
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const fileDateTimeStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

  const headers = [
    'No',
    'Waktu & Tanggal',
    'Nama Barang',
    'Varian (Ukuran / Warna)',
    'Tipe Aktivitas',
    'Perubahan (Pcs)',
    'Stok Sebelum (Pcs)',
    'Stok Sesudah (Pcs)',
    'Keterangan / Alasan',
    'Perangkat',
    'Operator / Kasir'
  ];

  const getIndonesianType = (type: string) => {
    switch (type) {
      case 'sale': return 'Penjualan (Barang Keluar)';
      case 'restock': return 'Restock (Barang Masuk)';
      case 'adjustment': return 'Penyesuaian Opname';
      case 'return': return 'Retur Barang';
      case 'damage': return 'Barang Rusak / Reject';
      default: return type;
    }
  };

  const rows = logs.map((log, idx) => {
    const formattedDate = new Date(log.timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';

    return [
      String(idx + 1),
      escapeCsvCell(formattedDate),
      escapeCsvCell(log.productName),
      escapeCsvCell(log.variantDescription),
      escapeCsvCell(getIndonesianType(log.changeType)),
      String(log.delta > 0 ? `+${log.delta}` : log.delta),
      String(log.previousStock),
      String(log.newStock),
      escapeCsvCell(log.reason || '-'),
      escapeCsvCell(log.deviceName),
      escapeCsvCell(log.operatorName)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `Riwayat_Aktivitas_STZstok_${fileDateTimeStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { parseDelimitedText } from './fileImport.ts';

/**
 * Parses inventory CSV / text (supporting both flat tabular export and hierarchical Excel sheets)
 * and returns structured Product payloads
 */
export function parseInventoryCSV(csvText: string): Partial<Product>[] {
  return parseDelimitedText(csvText);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function getColorHex(colorName: string): string {
  const c = colorName.toLowerCase();
  if (c.includes('hitam') || c.includes('black')) return '#1E293B';
  if (c.includes('putih') || c.includes('white')) return '#F8FAFC';
  if (c.includes('army') || c.includes('sage') || c.includes('green') || c.includes('hijau')) return '#4D7C0F';
  if (c.includes('mocca') || c.includes('coklat') || c.includes('brown')) return '#A27B5C';
  if (c.includes('cream') || c.includes('krem') || c.includes('beige')) return '#E2D4B7';
  if (c.includes('navy') || c.includes('biru') || c.includes('blue')) return '#1E3A8A';
  if (c.includes('abu') || c.includes('grey') || c.includes('gray')) return '#64748B';
  if (c.includes('merah') || c.includes('maroon') || c.includes('red')) return '#991B1B';
  if (c.includes('pink') || c.includes('dusty')) return '#F472B6';
  if (c.includes('kuning') || c.includes('yellow') || c.includes('mustard')) return '#F59E0B';
  return '#94A3B8';
}

import * as XLSX from 'xlsx';
import type { Product, ProductVariant } from '../types/inventory.ts';

/**
 * Maps color names to hex codes for UI representation
 */
export function getColorHex(colorName: string): string {
  const c = (colorName || '').toLowerCase().trim();
  if (!c || c === 'standar' || c === 'default') return '#94A3B8';
  if (c.includes('hitam') || c.includes('black')) return '#1E293B';
  if (c.includes('putih') || c.includes('white')) return '#F8FAFC';
  if (c.includes('army') || c.includes('sage') || c.includes('hijau') || c.includes('green') || c.includes('olive')) return '#4D7C0F';
  if (c.includes('mocca') || c.includes('coklat') || c.includes('brown') || c.includes('choco') || c.includes('tan')) return '#A27B5C';
  if (c.includes('cream') || c.includes('krem') || c.includes('beige') || c.includes('nude') || c.includes('ivory')) return '#E2D4B7';
  if (c.includes('navy') || c.includes('biru') || c.includes('blue') || c.includes('denim')) return '#1E3A8A';
  if (c.includes('abu') || c.includes('grey') || c.includes('gray') || c.includes('silver')) return '#64748B';
  if (c.includes('merah') || c.includes('maroon') || c.includes('red') || c.includes('burgundy')) return '#991B1B';
  if (c.includes('pink') || c.includes('dusty') || c.includes('rose') || c.includes('fuchsia')) return '#F472B6';
  if (c.includes('kuning') || c.includes('yellow') || c.includes('mustard') || c.includes('lemon')) return '#F59E0B';
  if (c.includes('ungu') || c.includes('purple') || c.includes('lilac') || c.includes('lavender')) return '#9333EA';
  if (c.includes('orange') || c.includes('oranye') || c.includes('bata') || c.includes('terracotta')) return '#EA580C';
  return '#94A3B8';
}

/**
 * Cleans numerical stock value from strings (e.g. "=20+10", "1.234", "15 pcs", "0")
 */
export function parseNumericValue(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : Math.max(0, Math.round(val));
  }
  const str = String(val).trim();
  if (!str) return fallback;

  // If formula like =20+10+5
  if (str.startsWith('=')) {
    try {
      const parts = str.substring(1).split('+').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
      if (parts.length > 0) {
        return Math.max(0, Math.round(parts.reduce((a, b) => a + b, 0)));
      }
    } catch {}
  }

  // Remove currency, text, etc.
  const cleanStr = str.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? fallback : Math.max(0, Math.round(num));
}

/**
 * Universal Parser that processes ANY file (Excel .xlsx, .xls, .csv, .tsv, .txt, .json)
 * or raw text into structured Product data.
 */
export async function parseUniversalFile(file: File): Promise<Partial<Product>[]> {
  const fileName = file.name.toLowerCase();

  // 1. JSON file handler
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    return parseJsonInventory(text);
  }

  // 2. Excel spreadsheets (.xlsx, .xls, .ods)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
    const buffer = await file.arrayBuffer();
    return parseExcelBuffer(buffer);
  }

  // 3. Delimited text files (.csv, .tsv, .txt, or any other file)
  // Read text with proper encoding fallback
  try {
    const buffer = await file.arrayBuffer();
    // Try UTF-8 first
    const decoderUtf8 = new TextDecoder('utf-8', { fatal: false });
    const textUtf8 = decoderUtf8.decode(buffer);

    // If starts with JSON structure
    const trimmed = textUtf8.trim();
    if (trimmed.startsWith('[') || (trimmed.startsWith('{') && trimmed.includes('"products"'))) {
      try {
        return parseJsonInventory(trimmed);
      } catch {}
    }

    // Try parsing as spreadsheet or CSV via SheetJS or line parser
    try {
      const parsedXlsx = parseExcelBuffer(buffer);
      if (parsedXlsx.length > 0) return parsedXlsx;
    } catch {}

    return parseDelimitedText(textUtf8);
  } catch (err) {
    console.warn('Fallback to text reading:', err);
    const text = await file.text();
    return parseDelimitedText(text);
  }
}

/**
 * Parses JSON inventory format
 */
export function parseJsonInventory(jsonText: string): Partial<Product>[] {
  const data = JSON.parse(jsonText);
  let rawList: any[] = [];

  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && Array.isArray(data.products)) {
    rawList = data.products;
  } else if (data && Array.isArray(data.items)) {
    rawList = data.items;
  } else if (data && typeof data === 'object') {
    rawList = [data];
  }

  const result: Partial<Product>[] = [];

  for (const item of rawList) {
    if (!item || (!item.name && !item.nama && !item.sku)) continue;

    const name = String(item.name || item.nama || item.sku || 'Produk').trim();
    const category = String(item.category || item.kategori || 'Pakaian Busana').trim();
    const description = String(item.description || item.deskripsi || '').trim();
    const location = String(item.location || item.lokasi || 'Gudang Utama').trim();
    const sku = String(item.sku || item.kode || '').trim();
    const imageUrl = String(item.imageUrl || item.gambar || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg');

    let variants: ProductVariant[] = [];
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      variants = item.variants.map((v: any, idx: number) => ({
        id: v.id || `var-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        sku: v.sku || '',
        size: String(v.size || v.ukuran || 'All Size').trim(),
        color: String(v.color || v.warna || 'Standar').trim(),
        colorHex: v.colorHex || getColorHex(v.color || v.warna),
        stock: parseNumericValue(v.stock ?? v.stok ?? v.jumlah ?? v.pcs, 0),
        minStock: parseNumericValue(v.minStock ?? v.batasMin ?? v.min, 2),
        price: parseNumericValue(v.price ?? v.harga ?? v.jual, 0),
        costPrice: parseNumericValue(v.costPrice ?? v.modal ?? v.beli, 0),
        barcode: v.barcode || '',
      }));
    } else {
      // Default single variant
      const stock = parseNumericValue(item.stock ?? item.totalStock ?? item.stok ?? item.jumlah, 0);
      variants = [{
        id: `var-${Date.now()}-1`,
        sku,
        size: 'All Size',
        color: 'Standar',
        colorHex: '#94A3B8',
        stock,
        minStock: 2,
        price: parseNumericValue(item.price ?? item.harga, 0),
        costPrice: parseNumericValue(item.costPrice ?? item.modal, 0),
        barcode: '',
      }];
    }

    result.push({
      name,
      category,
      description,
      location,
      sku,
      imageUrl,
      variants,
      totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
    });
  }

  return result;
}

/**
 * Parses binary Excel buffer (XLSX, XLS, ODS) into Products
 */
export function parseExcelBuffer(buffer: ArrayBuffer): Partial<Product>[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return [];
  }

  const allProducts: Partial<Product>[] = [];

  // Loop through all sheets in the Excel workbook
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert sheet to 2D array of rows
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    const parsedSheetProducts = parseMatrixRows(rows, sheetName);
    allProducts.push(...parsedSheetProducts);
  }

  // Deduplicate / merge products with identical names
  return consolidateProducts(allProducts);
}

/**
 * Parses text (CSV, TSV, semi-colon, or pipe delimited)
 */
export function parseDelimitedText(text: string): Partial<Product>[] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  // Determine delimiter
  const firstLines = clean.split(/\r?\n/).slice(0, 10).join('\n');
  const countTabs = (firstLines.match(/\t/g) || []).length;
  const countSemicolons = (firstLines.match(/;/g) || []).length;
  const countPipes = (firstLines.match(/\|/g) || []).length;
  const countCommas = (firstLines.match(/,/g) || []).length;

  let delimiter = ',';
  if (countTabs > countCommas && countTabs > countSemicolons) {
    delimiter = '\t';
  } else if (countSemicolons > countCommas) {
    delimiter = ';';
  } else if (countPipes > countCommas) {
    delimiter = '|';
  }

  // Parse lines into 2D array
  const rawLines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const matrix: string[][] = rawLines.map(line => parseDelimitedLine(line, delimiter));

  return parseMatrixRows(matrix, 'Sheet1');
}

/**
 * Parses a single delimited line with quotes support
 */
function parseDelimitedLine(line: string, delimiter: string): string[] {
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
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Core Matrix (2D Rows) Parser:
 * Detects headers, supports both hierarchical fill-down and flat tabular rows,
 * and extracts clean Indonesian / English inventory data.
 */
export function parseMatrixRows(rows: any[][], defaultCategoryName = 'Pakaian Busana'): Partial<Product>[] {
  if (rows.length === 0) return [];

  // 1. Scan for header row
  let headerRowIdx = -1;
  let headers: string[] = [];

  const isNameHeader = (h: string) => {
    const str = String(h || '').toLowerCase().trim();
    if (!str || str.length > 40) return false;
    return (
      str === 'nama' ||
      str === 'nama barang' ||
      str === 'nama produk' ||
      str === 'nama pakaian' ||
      str === 'sku / kode' ||
      str === 'sku' ||
      str === 'kode' ||
      str === 'produk' ||
      str === 'item' ||
      str === 'model' ||
      str === 'artikel'
    );
  };

  const isStockHeader = (h: string) => {
    const str = String(h || '').toLowerCase().trim();
    if (!str || str.length > 40) return false;
    return (
      str === 'pcs' ||
      str === 'stok' ||
      str === 'stok (pcs)' ||
      str === 'jumlah' ||
      str === 'qty' ||
      str === 'quantity' ||
      str === 'masuk' ||
      str === 'stok masuk' ||
      str === 'total stok' ||
      str.includes('pcs') ||
      str.includes('stok')
    );
  };

  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i] || [];
    const strCells = row.map(c => String(c || '').toLowerCase().trim());
    if (strCells.filter(Boolean).length < 2) continue;

    const hasName = strCells.some(isNameHeader);
    const hasStock = strCells.some(isStockHeader);

    if (hasName || (hasStock && strCells.some(c => c.includes('warna') || c.includes('size')))) {
      headerRowIdx = i;
      headers = strCells;
      break;
    }
  }

  // If no clear header detected, fallback to first non-empty row
  if (headerRowIdx === -1) {
    headerRowIdx = 0;
    headers = (rows[0] || []).map(c => String(c || '').toLowerCase().trim());
  }

  // Map column indexes
  let idxName = headers.findIndex(h => 
    h === 'sku / kode' || h === 'nama barang' || h === 'nama pakaian' || h === 'nama produk' ||
    h === 'sku' || h === 'kode' || h === 'produk' || h === 'item' || h === 'model' || h === 'artikel' ||
    (h.includes('nama') && !h.includes('kasir') && !h.includes('operator')) ||
    (h.includes('barang') && !h.includes('keluar'))
  );
  if (idxName === -1) {
    // If not found, use first column with string text
    idxName = headers.findIndex(h => h.length > 0 && !h.includes('no') && !h.includes('nomor'));
    if (idxName === -1) idxName = 1;
  }

  const idxColor = headers.findIndex(h => h.includes('warna') || h.includes('color') || h.includes('corak'));
  const idxSize = headers.findIndex(h => h.includes('size') || h.includes('ukuran') || h === 'sz');
  let idxStock = headers.findIndex(h => h === 'pcs' || h === 'stok (pcs)' || h === 'jumlah' || h === 'stok' || h === 'qty' || h.includes('pcs') || h.includes('stok'));
  const idxMinStock = headers.findIndex(h => h.includes('min') || h.includes('batas'));
  const idxCategory = headers.findIndex(h => h.includes('kategori') || h.includes('category') || h.includes('jenis'));
  const idxPrice = headers.findIndex(h => h.includes('harga') || h.includes('jual') || h.includes('price'));
  const idxCost = headers.findIndex(h => h.includes('modal') || h.includes('beli') || h.includes('hpp') || h.includes('cost'));
  const idxBarcode = headers.findIndex(h => h.includes('barcode') || h.includes('kode barcode'));
  const idxLocation = headers.findIndex(h => h.includes('rak') || h.includes('lokasi') || h.includes('gudang'));

  // Sub-header check (e.g. Row 4 JUMLAH, Row 5 PCS / LUSIN)
  if (headerRowIdx + 1 < rows.length) {
    const nextRow = (rows[headerRowIdx + 1] || []).map(c => String(c || '').toLowerCase().trim());
    const subPcs = nextRow.findIndex(c => c === 'pcs' || c === 'stok (pcs)' || c === 'jumlah');
    if (subPcs !== -1) {
      idxStock = subPcs;
      headerRowIdx++;
    }
  }

  const productMap = new Map<string, {
    category: string;
    description: string;
    location: string;
    sku: string;
    variants: ProductVariant[];
  }>();

  let currentProductName = '';
  let currentColor = 'Standar';

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    if (!row || row.length === 0) continue;

    // Read cells
    const rawName = idxName !== -1 && row[idxName] !== undefined ? String(row[idxName]).trim() : '';
    
    // Ignore footer/summary rows like "TOTAL PCS-STOK", "TOTAL", "JUMLAH", etc.
    if (rawName && !/^total/i.test(rawName) && !/^jumlah\s+total/i.test(rawName) && !/^grand\s+total/i.test(rawName) && !/^no$/i.test(rawName)) {
      currentProductName = rawName;
    }

    if (!currentProductName) continue;

    const rawColor = idxColor !== -1 && row[idxColor] !== undefined ? String(row[idxColor]).trim() : '';
    if (rawColor) {
      currentColor = rawColor;
    }

    const rawSize = idxSize !== -1 && row[idxSize] !== undefined ? String(row[idxSize]).trim() : '';
    const size = rawSize || 'All Size';

    // Parse stock
    const rawStock = idxStock !== -1 && row[idxStock] !== undefined ? row[idxStock] : 0;
    const stock = parseNumericValue(rawStock, 0);

    // Skip blank filler rows with 0 stock and no color or size
    if (!rawColor && !rawSize && stock === 0 && !rawName) {
      continue;
    }

    const minStock = idxMinStock !== -1 && row[idxMinStock] !== undefined
      ? parseNumericValue(row[idxMinStock], 2)
      : 2;

    const price = idxPrice !== -1 && row[idxPrice] !== undefined
      ? parseNumericValue(row[idxPrice], 0)
      : 0;

    const costPrice = idxCost !== -1 && row[idxCost] !== undefined
      ? parseNumericValue(row[idxCost], 0)
      : 0;

    const rawCat = idxCategory !== -1 && row[idxCategory] !== undefined ? String(row[idxCategory]).trim() : '';
    const category = rawCat || (currentProductName.toLowerCase().includes('rok') 
      ? 'Rok Busana' 
      : currentProductName.toLowerCase().includes('kulot') || currentProductName.toLowerCase().includes('celana')
      ? 'Celana & Kulot'
      : defaultCategoryName || 'Pakaian Busana');

    const location = idxLocation !== -1 && row[idxLocation] !== undefined ? String(row[idxLocation]).trim() : 'Gudang Utama';
    const barcode = idxBarcode !== -1 && row[idxBarcode] !== undefined ? String(row[idxBarcode]).trim() : '';

    if (!productMap.has(currentProductName)) {
      productMap.set(currentProductName, {
        category,
        description: '',
        location,
        sku: currentProductName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10),
        variants: [],
      });
    }

    const item = productMap.get(currentProductName)!;
    item.variants.push({
      id: `var-${Date.now()}-${item.variants.length + 1}-${Math.random().toString(36).substring(2, 6)}`,
      size,
      color: currentColor || 'Standar',
      colorHex: getColorHex(currentColor),
      stock,
      minStock,
      price,
      costPrice,
      barcode,
    });
  }

  const result: Partial<Product>[] = [];
  for (const [name, data] of productMap.entries()) {
    result.push({
      name,
      category: data.category,
      imageUrl: '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg',
      description: data.description,
      location: data.location,
      sku: data.sku,
      variants: data.variants,
      totalStock: data.variants.reduce((sum, v) => sum + v.stock, 0),
    });
  }

  return result;
}

/**
 * Consolidates products with the same name across sheets or sections
 */
function consolidateProducts(products: Partial<Product>[]): Partial<Product>[] {
  const map = new Map<string, Partial<Product>>();

  for (const p of products) {
    if (!p.name) continue;
    const key = p.name.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, { ...p, variants: [...(p.variants || [])] });
    } else {
      const existing = map.get(key)!;
      // Merge variants
      const existingVars = existing.variants || [];
      const newVars = p.variants || [];
      existing.variants = [...existingVars, ...newVars];
      existing.totalStock = existing.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
  }

  return Array.from(map.values());
}

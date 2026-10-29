import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { parseUniversalFile, parseDelimitedText, parseJsonInventory } from '../utils/fileImport.ts';
import type { Product } from '../types/inventory.ts';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  FileCheck,
  ClipboardPaste,
  Layers,
  PlusCircle,
  RotateCcw
} from 'lucide-react';

interface UniversalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalImportModal: React.FC<UniversalImportModalProps> = ({ isOpen, onClose }) => {
  const { batchImportProducts } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [parsedProducts, setParsedProducts] = useState<Partial<Product>[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'update' | 'add' | 'replace'>('update');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<{ count: number; totalUnits: number; updatedCount?: number; addedCount?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setErrorMessage('');
    setSuccessInfo(null);
    setSourceFileName(file.name);

    try {
      const results = await parseUniversalFile(file);
      if (results.length === 0) {
        setErrorMessage(
          'Tidak dapat menemukan data barang dari file ini. Pastikan file memiliki nama barang/pakaian dan kolom stok.'
        );
        setParsedProducts([]);
      } else {
        setParsedProducts(results);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal membaca isi berkas. Pastikan file tidak rusak.');
      setParsedProducts([]);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcessPaste = () => {
    if (!pasteText.trim()) return;
    setIsParsing(true);
    setErrorMessage('');
    setSuccessInfo(null);
    setSourceFileName('Teks / Salinan Excel');

    try {
      const trimmed = pasteText.trim();
      let results: Partial<Product>[] = [];

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          results = parseJsonInventory(trimmed);
        } catch {
          results = parseDelimitedText(trimmed);
        }
      } else {
        results = parseDelimitedText(trimmed);
      }

      if (results.length === 0) {
        setErrorMessage(
          'Tidak ada data barang yang terdeteksi dari teks yang ditempel. Coba salin kolom nama barang, warna, ukuran, dan stok dari tabel.'
        );
        setParsedProducts([]);
      } else {
        setParsedProducts(results);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses teks.');
      setParsedProducts([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await batchImportProducts(
        parsedProducts,
        importMode === 'replace',
        sourceFileName || 'Berkas Impor',
        importMode
      );

      if (res.success) {
        setSuccessInfo({
          count: res.count,
          totalUnits: res.totalUnits,
          updatedCount: res.updatedCount,
          addedCount: res.addedCount,
        });
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Gagal mengimpor data ke server.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSelection = () => {
    setParsedProducts([]);
    setSourceFileName('');
    setPasteText('');
    setErrorMessage('');
    setSuccessInfo(null);
  };

  const totalCalculatedUnits = parsedProducts.reduce(
    (sum, p) => sum + (p.totalStock || (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0)),
    0
  );

  const totalCalculatedVariants = parsedProducts.reduce(
    (sum, p) => sum + (p.variants || []).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-yellow-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-yellow-100 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-950 leading-tight">
                Import & Update Stok dari Semua File
              </h2>
              <p className="text-xs text-slate-900/80 font-medium">
                Mendukung Excel (.xlsx, .xls), CSV, TSV, TXT, JSON & salin tabel langsung
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tab Selection */}
          {parsedProducts.length === 0 && (
            <div className="flex items-center gap-2 p-1 bg-yellow-50 border border-yellow-200/80 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => { setActiveTab('file'); setErrorMessage(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'file'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Pilih File Berkas</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('paste'); setErrorMessage(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Tempel Tabel (Copy-Paste)</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Gagal Membaca Berkas:</span>
                <p className="mt-0.5 text-rose-900/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successInfo && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-3 text-xs animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="font-black text-sm text-emerald-900">✓ Berhasil Memproses Stok!</div>
                <p className="text-emerald-800 mt-0.5">
                  Berhasil menyimpan <strong>{successInfo.count} model barang</strong> ({successInfo.totalUnits.toLocaleString('id-ID')} unit stok).
                  {successInfo.updatedCount !== undefined && successInfo.addedCount !== undefined && (
                    <span className="block mt-0.5 font-medium text-emerald-900">
                      ({successInfo.updatedCount} model stok diperbarui, {successInfo.addedCount} produk baru ditambahkan).
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Upload or Paste Input */}
          {parsedProducts.length === 0 ? (
            activeTab === 'file' ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*, .xlsx, .xls, .csv, .tsv, .txt, .json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform mb-3 shadow-xs">
                  {isParsing ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-600" />
                  ) : (
                    <FileSpreadsheet className="w-7 h-7" />
                  )}
                </div>

                <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {isParsing ? 'Membaca dan Memproses File...' : 'Klik atau Tarik Berkas ke Sini'}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Mendukung semua format: <strong>Excel (.xlsx, .xls)</strong>, <strong>CSV</strong>, <strong>TSV</strong>, <strong>TXT</strong>, atau <strong>JSON</strong>.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[11px] font-bold text-amber-900">
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-yellow-200">.xlsx / Excel</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-yellow-200">.xls / Excel Lama</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-yellow-200">.csv / Delimited</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-yellow-200">.tsv / Tab Delimited</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-yellow-200">.txt / Teks</span>
                  <span className="px-2.5 py-1 bg-white rounded-lg border border-yellow-200">.json</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                  <ClipboardPaste className="w-4 h-4 text-amber-600" />
                  <span>Salin kolom dari Excel atau Spreadsheet lalu tempel di sini:</span>
                </div>
                <textarea
                  rows={8}
                  placeholder="Contoh salinan tabel Excel:&#10;Nama Barang	Warna	Size	Stok&#10;KUREA	HITAM	M	20&#10;KUREA	HITAM	L	138&#10;HINATA	ARMY	XL	33"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-yellow-50/40 border border-yellow-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white resize-y"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleProcessPaste}
                    disabled={!pasteText.trim() || isParsing}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-2"
                  >
                    {isParsing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck className="w-4 h-4" />
                    )}
                    <span>Proses Teks Tabel</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* STEP 2: Preview & Confirmation */
            <div className="space-y-4 animate-in fade-in">
              {/* Stats overview card */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-yellow-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm">
                      {sourceFileName || 'Berkas Terbaca'}
                    </div>
                    <div className="text-xs text-amber-900/80 font-medium mt-0.5">
                      Berhasil membaca <strong>{parsedProducts.length} model barang</strong> ({totalCalculatedVariants} varian)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold uppercase">Total Stok Fisik</div>
                    <div className="text-lg font-black text-slate-900">
                      {totalCalculatedUnits.toLocaleString('id-ID')}{' '}
                      <span className="text-xs font-normal text-slate-500">pcs</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 ml-2"
                  >
                    Ganti File
                  </button>
                </div>
              </div>

              {/* Import Mode Radio Options */}
              <div className="p-3.5 bg-white rounded-2xl border border-yellow-200/90 space-y-2">
                <div className="text-xs font-bold text-slate-800">Pilih Cara Pembaruan Stok:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Mode 1: Update Stok (Opname / Set) */}
                  <label
                    onClick={() => setImportMode('update')}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      importMode === 'update'
                        ? 'bg-amber-50 border-amber-400 text-slate-900 ring-1 ring-amber-300'
                        : 'bg-white border-yellow-200/70 text-slate-600 hover:bg-yellow-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'update'}
                        onChange={() => setImportMode('update')}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          <span>Update Stok Fisik</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Menyesuaikan stok barang yang cocok dengan angka terbaru di berkas, dan menambah barang baru.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Mode 2: Tambah Stok (+Qty / Restock) */}
                  <label
                    onClick={() => setImportMode('add')}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      importMode === 'add'
                        ? 'bg-emerald-50 border-emerald-400 text-slate-900 ring-1 ring-emerald-300'
                        : 'bg-white border-yellow-200/70 text-slate-600 hover:bg-yellow-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'add'}
                        onChange={() => setImportMode('add')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="font-extrabold text-emerald-950 flex items-center gap-1">
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tambah Stok (+Qty)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Menambahkan jumlah unit dari berkas ke stok berjalan sekarang (misal: kiriman barang baru).
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Mode 3: Ganti Total Katalog */}
                  <label
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-rose-50 border-rose-400 text-slate-900 ring-1 ring-rose-300'
                        : 'bg-white border-yellow-200/70 text-slate-600 hover:bg-yellow-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="font-extrabold text-rose-950 flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ganti Total Katalog</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Mengosongkan katalog lama dan mengisi penuh dengan data berkas baru ini.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table of Detected Items */}
              <div className="border border-yellow-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-yellow-50 border-b border-yellow-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Pratinjau {Math.min(parsedProducts.length, 12)} dari {parsedProducts.length} Produk:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Format rapi terdeteksi otomatis
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-yellow-100 text-xs">
                  {parsedProducts.slice(0, 20).map((p, idx) => {
                    const variants = p.variants || [];
                    const stock = variants.reduce((s, v) => s + (v.stock || 0), 0);
                    return (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-yellow-50/40">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-100 text-amber-900 font-semibold">
                              {p.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {variants.length} Varian:{' '}
                            <span className="text-slate-700 font-medium">
                              {variants.slice(0, 5).map(v => `${v.color}/${v.size} (${v.stock})`).join(', ')}
                              {variants.length > 5 ? ` +${variants.length - 5} lainnya` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-black text-slate-900 text-xs sm:text-sm">
                            {stock} pcs
                          </div>
                          <div className="text-[10px] text-amber-800">
                            ≈ {(stock / 12).toFixed(1)} lsn
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {parsedProducts.length > 20 && (
                    <div className="p-2.5 text-center text-xs text-slate-500 font-semibold bg-yellow-50/50">
                      ... dan {parsedProducts.length - 20} model produk lainnya
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-yellow-100 bg-yellow-50/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            Batal
          </button>

          {parsedProducts.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSubmitting || parsedProducts.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-slate-950 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-amber-500/25 active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Stok...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {importMode === 'add' ? 'Tambah Stok Masuk' : importMode === 'replace' ? 'Ganti Total Katalog' : 'Update Stok Sekarang'} ({parsedProducts.length} Model • {totalCalculatedUnits.toLocaleString('id-ID')} Pcs)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

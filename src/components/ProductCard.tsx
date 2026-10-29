import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { formatLusin } from '../utils/formatters.ts';
import { 
  MapPin, 
  AlertTriangle, 
  AlertOctagon, 
  Edit3, 
  SlidersHorizontal,
  Plus,
  Minus
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenAdjust: (product: Product, variantId?: string) => void;
  onOpenEdit: (product: Product) => void;
  filterStatus?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenAdjust,
  onOpenEdit,
  filterStatus,
}) => {
  const { settings, adjustStock } = useInventory();
  const defaultMin = settings.defaultMinStockAlert || 3;
  const variantsList = Array.isArray(product.variants) ? product.variants : [];

  const defaultVar = useMemo(() => {
    if (filterStatus === 'low') {
      const lowVar = variantsList.find((v) => {
        const s = Number(v.stock);
        const m = Number(v.minStock) > 0 ? Number(v.minStock) : defaultMin;
        return s > 0 && s <= m;
      });
      if (lowVar) return lowVar;
    }
    if (filterStatus === 'out') {
      const outVar = variantsList.find((v) => Number(v.stock) <= 0);
      if (outVar) return outVar;
    }
    const zeroVar = variantsList.find((v) => Number(v.stock) <= 0);
    if (zeroVar) return zeroVar;
    const lowVar = variantsList.find((v) => {
      const s = Number(v.stock);
      const m = Number(v.minStock) > 0 ? Number(v.minStock) : defaultMin;
      return s > 0 && s <= m;
    });
    if (lowVar) return lowVar;
    return variantsList[0];
  }, [variantsList, filterStatus, defaultMin]);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVar?.id || '');

  useEffect(() => {
    if (defaultVar?.id) {
      setSelectedVariantId(defaultVar.id);
    }
  }, [defaultVar?.id, filterStatus]);

  const selectedVariant = variantsList.find((v) => v.id === selectedVariantId) || variantsList[0];

  const isTotalOut = Number(product.totalStock) === 0;
  const zeroVariants = variantsList.filter((v) => Number(v.stock) <= 0);
  const hasZeroVariant = zeroVariants.length > 0;
  const lowVariants = variantsList.filter((v) => {
    const vStock = Number(v.stock);
    const min = Number(v.minStock) > 0 ? Number(v.minStock) : defaultMin;
    return vStock > 0 && vStock <= min;
  });
  const hasLowVariant = lowVariants.length > 0;

  // Sort variants so relevant variants (based on filterStatus or critical stock) appear first
  const sortedVariants = useMemo(() => {
    return [...variantsList].sort((a, b) => {
      const aStock = Number(a.stock);
      const bStock = Number(b.stock);
      const aMin = Number(a.minStock) > 0 ? Number(a.minStock) : defaultMin;
      const bMin = Number(b.minStock) > 0 ? Number(b.minStock) : defaultMin;

      if (filterStatus === 'low') {
        const aIsLow = aStock > 0 && aStock <= aMin ? 0 : 1;
        const bIsLow = bStock > 0 && bStock <= bMin ? 0 : 1;
        if (aIsLow !== bIsLow) return aIsLow - bIsLow;
      }
      if (filterStatus === 'out') {
        const aIsOut = aStock <= 0 ? 0 : 1;
        const bIsOut = bStock <= 0 ? 0 : 1;
        if (aIsOut !== bIsOut) return aIsOut - bIsOut;
      }

      const aOut = aStock <= 0 ? 0 : 1;
      const bOut = bStock <= 0 ? 0 : 1;
      if (aOut !== bOut) return aOut - bOut;

      const aLow = aStock <= aMin ? 0 : 1;
      const bLow = bStock <= bMin ? 0 : 1;
      return aLow - bLow;
    });
  }, [variantsList, filterStatus, defaultMin]);

  return (
    <div className="bg-white rounded-2xl border border-yellow-200/90 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Product Image & Top Badges */}
      <div className="relative aspect-[4/3] bg-yellow-50 overflow-hidden">
        <img
          src={product.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg'}
          alt={product.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay for badges readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 items-center">
          {product.sku && product.sku.trim() !== '' && (
            <span className="text-[10px] font-extrabold tracking-wider bg-slate-900/85 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-md shadow-sm">
              {product.sku}
            </span>
          )}
          {product.category && product.category.trim() !== '' && (
            <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md shadow-sm">
              {product.category}
            </span>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onOpenEdit(product)}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-all active:scale-95"
          title="Edit Barang"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        {/* Bottom Badges on Image */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
          {product.location ? (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded">
              <MapPin className="w-3 h-3 text-amber-300" />
              <span className="truncate max-w-[110px] sm:max-w-[130px]">{product.location}</span>
            </div>
          ) : (
            <div />
          )}

          <div>
            {isTotalOut ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3 h-3 text-white" />
                <span>0 pcs (TOTAL HABIS)</span>
              </span>
            ) : hasZeroVariant ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-white" />
                <span>{product.totalStock} pcs ({zeroVariants.length} Varian Habis)</span>
              </span>
            ) : hasLowVariant ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-slate-950" />
                <span>{product.totalStock} pcs (Menipis)</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-600/95 text-white px-2 py-0.5 rounded shadow">
                {product.totalStock} pcs ({formatLusin(product.totalStock)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-2">
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Variant Selector Chips */}
          <div className="space-y-1.5 mb-2.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Varian & Stok Fisik:</span>
              <span className="text-amber-800/80 font-medium">Pilih varian</span>
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-0.5">
              {sortedVariants.map((variant) => {
                const isSelected = variant.id === selectedVariant?.id;
                const vStock = Number(variant.stock) || 0;
                const vMin = Number(variant.minStock) > 0 ? Number(variant.minStock) : defaultMin;
                const isOut = vStock <= 0;
                const isLow = vStock <= vMin && vStock > 0;

                return (
                  <div
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? isOut
                          ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400/40'
                          : 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400/40'
                        : isOut
                        ? 'border-rose-300 bg-rose-50/40'
                        : 'border-yellow-100 hover:border-yellow-300 bg-yellow-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="font-black text-slate-900 bg-white/90 px-1.5 py-0.5 rounded border border-slate-300 text-xs shadow-2xs">
                        {variant.size}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        Warna: <span className="font-black text-slate-950">{variant.color}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-md shadow-xs ${
                          isOut
                            ? 'bg-rose-600 text-white'
                            : isLow
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
                        }`}
                      >
                        {isOut ? '0 pcs (HABIS)' : isLow ? `${vStock} pcs (MENIPIS)` : `${vStock} pcs`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button & Quick Direct Stock Step */}
        <div className="pt-2 border-t border-yellow-100 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (selectedVariant && selectedVariant.stock > 0) {
                adjustStock(product.id, selectedVariant.id, -1, 'sale', 'Penjualan Cepat Kasir (-1)');
              }
            }}
            disabled={!selectedVariant || selectedVariant.stock <= 0}
            className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center border border-rose-200 transition-all active:scale-90 shrink-0"
            title={`Kurangi 1 pcs ${selectedVariant?.size || ''} (${selectedVariant?.color || ''})`}
          >
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <button
            onClick={() => onOpenAdjust(product, selectedVariant?.id)}
            className="flex-1 py-2 px-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 min-w-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 group-hover:text-slate-950 shrink-0" />
            <span className="truncate">Kelola Stok</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (selectedVariant) {
                adjustStock(product.id, selectedVariant.id, 1, 'restock', 'Restock Cepat (+1)');
              }
            }}
            className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 transition-all active:scale-90 shrink-0"
            title={`Tambah 1 pcs ${selectedVariant?.size || ''} (${selectedVariant?.color || ''})`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};

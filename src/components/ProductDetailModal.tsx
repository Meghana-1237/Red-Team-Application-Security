import React from 'react';
import { X, Star, ShieldCheck, ShoppingCart, Truck, Lock, ArrowLeft } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product, qty: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = React.useState(1);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {product.sku}
            </span>
            <span className="text-xs text-slate-400">{product.category}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 text-xs mb-1.5">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold text-slate-200">{product.rating}</span>
                <span className="text-slate-500">· {product.reviewsCount} customer reviews</span>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">
                {product.name}
              </h2>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>

              <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified cryptographic integrity</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  <span>Secure courier dispatch with tamper seals</span>
                </div>
              </div>
            </div>

            {/* Price & Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-2xl font-bold text-white">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  {product.stock} units available in warehouse
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-700 rounded-lg bg-slate-950">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-slate-300 hover:text-white text-sm"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-sm font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 text-slate-300 hover:text-white text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import { Product, User, VulnerabilityConfig } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (address: string, creditCard: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  config: VulnerabilityConfig;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  currentUser,
  onOpenAuth,
  config
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [address, setAddress] = useState(currentUser?.address || '128 Tech Boulevard, Suite 500, San Jose, CA 95113');
  const [cardNumber, setCardNumber] = useState('4242-8891-2309-4242');
  const [cardExp, setCardExp] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('391');

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    onCheckout(address, cardNumber);
    setIsCheckingOut(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base tracking-tight text-white">Your Shopping Cart</h2>
            <span className="text-xs text-slate-400">({items.length} items)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium text-sm">Your cart is currently empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Add security keys, hardware modules, or encrypted storage drives from the catalogue.
              </p>
            </div>
          ) : isCheckingOut ? (
            /* Checkout Form */
            <form onSubmit={handleSubmitCheckout} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="text-indigo-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Order Summary
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-white">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Secure Shipping:</span>
                  <span className="text-emerald-400 font-medium">Free (Standard)</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                  <span>Grand Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Shipping Destination</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Payment Details */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-slate-300 font-medium flex items-center justify-between">
                  <span>Card Payment Details</span>
                  {config.a09_logging_failure && (
                    <span className="text-[10px] text-rose-400 font-mono">
                      (A09: Unsanitized plain text logging active)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Card Number (e.g. 4242-8891-2309-4242)"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    className="p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="CVV"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>

              {!currentUser && (
                <div className="p-3 bg-amber-950/60 border border-amber-800 rounded text-amber-300 text-xs">
                  Please log in or register before completing checkout to associate orders with your account.
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs transition-colors shadow-sm"
                >
                  Confirm & Place Order
                </button>
              </div>
            </form>
          ) : (
            /* Items List */
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded-md bg-slate-900 border border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">
                    {item.product.name}
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    ${item.product.price.toFixed(2)} each
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-slate-800 rounded bg-slate-900 text-xs">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-2 py-0.5 font-semibold text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                      title="Remove product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && !isCheckingOut && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total</span>
              <span className="font-bold text-white text-lg">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

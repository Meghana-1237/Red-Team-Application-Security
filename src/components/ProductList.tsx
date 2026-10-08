import React, { useState } from 'react';
import { Search, ShieldAlert, Sparkles, AlertTriangle, Terminal, Check, ShoppingCart, Info, Star } from 'lucide-react';
import { Product, VulnerabilityConfig } from '../types';

interface ProductListProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  config: VulnerabilityConfig;
  executedQuery: string;
  isSqliHit: boolean;
  sqliExplanation?: string;
}

const CATEGORIES = ['All', 'Authentication', 'Storage', 'Networking', 'Peripherals', 'Privacy'];

export const ProductList: React.FC<ProductListProps> = ({
  products,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onSelectProduct,
  onAddToCart,
  config,
  executedQuery,
  isSqliHit,
  sqliExplanation
}) => {
  const [xssTriggered, setXssTriggered] = useState(false);

  // Check if search query contains XSS payload
  const hasXssPayload = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<img\b[^>]*onerror=|javascript:/i.test(searchQuery);

  return (
    <div className="space-y-6">
      {/* Hero Banner with Store Context & Security Warning */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Corporate Hardware Portal</span>
            <span aria-hidden="true">·</span>
            <span>Internal Security Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            SecureShop Hardware & Defenses
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Enterprise procurement portal for cryptographic hardware authenticators, air-gapped storage, and network privacy devices. 
            Audited for OWASP Top 10 vulnerabilities.
          </p>
        </div>

        {/* Quick Exploit Injection Helper Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            <span>Test Payloads:</span>
          </span>
          <button
            onClick={() => onSearchChange("' OR 1=1 --")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded font-mono transition-colors"
            title="Inject SQLi Tautology to bypass restrictions and dump all products"
          >
            ' OR 1=1 --
          </button>
          <button
            onClick={() => onSearchChange("<script>alert('XSS-Target-Hit')</script>")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded font-mono transition-colors"
            title="Inject Reflected XSS Script tag"
          >
            &lt;script&gt;alert(1)&lt;/script&gt;
          </button>
          <button
            onClick={() => onSearchChange("key")}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors"
          >
            Normal: "key"
          </button>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-slate-400 hover:text-white ml-auto"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* SQLi Exploit Notification Banner if active */}
      {isSqliHit && (
        <div className="bg-rose-950/80 border border-rose-600 rounded-lg p-4 text-rose-200 shadow-md">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-rose-100 flex items-center gap-2">
                <span>A03:2021 - SQL Injection Succeeded!</span>
                <span className="text-xs px-2 py-0.5 bg-rose-900 border border-rose-700 rounded text-rose-200">
                  CWE-89 Exposed
                </span>
              </div>
              <p className="text-xs text-rose-300">{sqliExplanation}</p>
              <div className="mt-2 p-2 bg-black/40 rounded border border-rose-900/60 font-mono text-xs text-rose-200 break-all">
                <code>Executed Query: {executedQuery}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reflected XSS Alert if payload present */}
      {hasXssPayload && config.a03_injection_xss && (
        <div className="bg-amber-950/80 border border-amber-600 rounded-lg p-4 text-amber-200 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-100 flex items-center gap-2">
                <span>A03:2021 - Reflected XSS Payload Detected!</span>
                <span className="text-xs px-2 py-0.5 bg-amber-900 border border-amber-700 rounded text-amber-200">
                  CWE-79 Triggered
                </span>
              </div>
              <p className="text-xs text-amber-300">
                The search parameter <code className="bg-black/30 px-1 py-0.5 rounded">{searchQuery}</code> is unescaped in vulnerable mode. In a live browser execution, this triggers an unauthorized script execution context.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => alert(`[SIMULATED OWASP XSS EXECUTION]\nOrigin: http://localhost:3000\nPayload: ${searchQuery}\nVictim Session Stolen: SEC_SESSION_1001`)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs rounded transition-colors"
                >
                  Simulate In-Browser Alert()
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Category Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by title or description (e.g., 'SSD', 'Key', or SQLi payload)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Query Debug Bar (Transparently displays backend query execution) */}
      <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="text-slate-500 font-sans font-semibold">Backend Query:</span>
          <span className="text-indigo-300 truncate">{executedQuery}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-sans">
          {config.a03_injection_sqli ? 'Mode: Vulnerable Concatenation' : 'Mode: Parameterized Statement'}
        </span>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-xl">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No products found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or reset filters to browse the catalog.
          </p>
          <button
            onClick={() => { onSearchChange(''); onCategoryChange('All'); }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const isConfidential = product.isRestricted;
            return (
              <div
                key={product.id}
                className={`flex flex-col bg-slate-900 rounded-xl overflow-hidden border transition-all ${
                  isConfidential
                    ? 'border-rose-600 ring-2 ring-rose-500/30'
                    : 'border-slate-800 hover:border-slate-700 shadow-sm'
                }`}
              >
                {/* Product Image */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden group">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {isConfidential && (
                    <div className="absolute top-2 right-2 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>RESTRICTED INTERNAL TOOL</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                    {product.sku}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>{product.category}</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-semibold text-slate-200">{product.rating}</span>
                      <span className="text-slate-500">({product.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-slate-100 tracking-tight line-clamp-1">
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
                    {product.description}
                  </p>

                  {/* Price & Action */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-white">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {product.stock} units in stock
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectProduct(product)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onAddToCart(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

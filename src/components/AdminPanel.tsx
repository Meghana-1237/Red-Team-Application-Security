import React, { useState } from 'react';
import { User, Product, LogEntry, VulnerabilityConfig } from '../types';
import { storeService } from '../services/storeService';
import { ShieldCheck, ShieldAlert, Plus, Trash2, Users, Package, FileCode, AlertOctagon, Terminal, Eye, Lock, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  currentUser: User | null;
  config: VulnerabilityConfig;
  onOpenAuth: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  config,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'users' | 'logs' | 'debug'>('inventory');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Authentication');
  const [newProductPrice, setNewProductPrice] = useState('59.99');
  const [newProductStock, setNewProductStock] = useState('25');
  const [newProductSku, setNewProductSku] = useState('SEC-NEW-010');
  const [newProductDesc, setNewProductDesc] = useState('');

  // Access validation via service
  const accessCheck = storeService.checkAdminAccess(currentUser, config);
  const products = storeService.getProducts();
  const users = storeService.getUsers();
  const logs = storeService.getLogs();

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName) return;
    storeService.addProduct({
      name: newProductName,
      category: newProductCategory,
      price: parseFloat(newProductPrice) || 29.99,
      stock: parseInt(newProductStock, 10) || 10,
      sku: newProductSku || `SEC-${Date.now().toString().slice(-4)}`,
      description: newProductDesc || 'Secure hardware component for internal security lab testing.',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
      isRestricted: false
    });
    setNewProductName('');
    setNewProductDesc('');
  };

  const handleDeleteProduct = (id: string) => {
    storeService.deleteProduct(id);
  };

  if (!accessCheck.hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-8">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">403 Forbidden: Administrative Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          {accessCheck.reason} In secure mode, you must be logged in as an authorized System Administrator (e.g. Marcus Vance).
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Authenticate as Admin
          </button>
        </div>
      </div>
    );
  }

  const debugInfo = storeService.getDebugEndpoint(config);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner with Broken Access Warning if bypassed */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Administrator Control Console</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
              Root Area
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage product inventory, inspect user accounts, and review backend audit logs.
          </p>
        </div>

        {/* Security Access Status */}
        <div className="flex items-center gap-2">
          {currentUser?.role === 'admin' ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Admin: {currentUser.email}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded border border-rose-800 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>A01 Bypass: {accessCheck.reason}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'text-white border-b-2 border-indigo-500 bg-slate-800/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Management ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-white border-b-2 border-indigo-500 bg-slate-800/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-white border-b-2 border-indigo-500 bg-slate-800/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Server Event Logs (A09 Test)</span>
        </button>
        <button
          onClick={() => setActiveTab('debug')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-medium transition-colors ${
            activeTab === 'debug'
              ? 'text-white border-b-2 border-indigo-500 bg-slate-800/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Debug /api/debug/env (A05 Test)</span>
        </button>
      </div>

      {/* Tab 1: Product Management */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Add Product Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add New Catalog Item</span>
            </h3>

            <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hardware Security Token"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">SKU Code</label>
                <input
                  type="text"
                  required
                  placeholder="SEC-MOD-042"
                  value={newProductSku}
                  onChange={(e) => setNewProductSku(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Category</label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                >
                  <option value="Authentication">Authentication</option>
                  <option value="Storage">Storage</option>
                  <option value="Networking">Networking</option>
                  <option value="Peripherals">Peripherals</option>
                  <option value="Privacy">Privacy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Price ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Initial Inventory Stock</label>
                <input
                  type="number"
                  required
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-slate-400 font-medium">Detailed Description</label>
                <input
                  type="text"
                  placeholder="Technical hardware specifications and cryptographic parameters..."
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs transition-colors shadow-sm"
                >
                  Save and Publish Product
                </button>
              </div>
            </form>
          </div>

          {/* Product Listing Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-indigo-300">{p.sku}</td>
                      <td className="p-3 font-medium text-white">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3 font-mono">${p.price.toFixed(2)}</td>
                      <td className="p-3 font-mono">{p.stock}</td>
                      <td className="p-3">
                        {p.isRestricted ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                            RESTRICTED (SQLi Target)
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Public
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Registered User Directory & Stored Credentials (A07 Audit)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {config.a07_auth_session_weakness ? 'Passwords: Unhashed Plaintext' : 'Passwords: Salted bcrypt'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Stored Password / Hash</th>
                  <th className="p-3">Session Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-indigo-300">{u.id}</td>
                    <td className="p-3 font-medium text-white">{u.name}</td>
                    <td className="p-3 font-mono text-slate-400">{u.email}</td>
                    <td className="p-3 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      {config.a07_auth_session_weakness ? (
                        <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900">
                          {u.passwordHash}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[10px]">
                          {u.passwordHash.slice(0, 15)}... (bcrypt hashed)
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {u.sessionToken || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Server Logs (A09 Weakness) */}
      {activeTab === 'logs' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white font-sans">
                A09: Security Logging & Monitoring Stream
              </h3>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded border font-mono ${
              config.a09_logging_failure
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              {config.a09_logging_failure ? 'Sensitive Data Exposed in Logs' : 'Redacted & Filtered'}
            </span>
          </div>

          <p className="text-slate-400 font-sans text-xs">
            Reviewing live system application logs. In vulnerable mode, sensitive plain text passwords, session IDs, and credit card CVVs are dumped into this stream without scrubbing.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded text-[11px] leading-relaxed border ${
                  log.containsSensitiveData && config.a09_logging_failure
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <span>[{log.timestamp}]</span>
                  <span className={`font-bold ${
                    log.level === 'SECURITY' ? 'text-amber-400' :
                    log.level === 'WARN' ? 'text-amber-300' :
                    log.level === 'ERROR' ? 'text-rose-400' : 'text-blue-400'
                  }`}>
                    {log.level}
                  </span>
                  <span>({log.source})</span>
                  {log.containsSensitiveData && config.a09_logging_failure && (
                    <span className="text-rose-400 font-semibold ml-auto">
                      [PCI/PII DATA LEAK]
                    </span>
                  )}
                </div>
                <div className="break-all">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Debug Endpoint (A05 Misconfig) */}
      {activeTab === 'debug' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white font-sans">
                A05: Security Misconfiguration - /api/debug/env Endpoint
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded border text-[11px] ${
              config.a05_security_misconfig
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              Status: HTTP {debugInfo.status}
            </span>
          </div>

          <p className="text-slate-400 font-sans">
            Diagnostic routes intended for local debugging were left enabled in production, exposing database passwords, JWT signing keys, and server infrastructure details.
          </p>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
              HTTP Response Headers:
            </span>
            <div className="text-slate-300 space-y-1">
              {Object.entries(debugInfo.headers).map(([key, val]) => (
                <div key={key}>
                  <span className="text-indigo-400">{key}:</span> {val}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
              HTTP Response Body:
            </span>
            <pre className="text-emerald-400 overflow-x-auto p-2 bg-black/50 rounded border border-slate-800">
              {JSON.stringify(debugInfo.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

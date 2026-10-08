import React, { useState } from 'react';
import { Order, User, VulnerabilityConfig } from '../types';
import { storeService } from '../services/storeService';
import { Package, Clock, ShieldAlert, ShieldCheck, Terminal, Search, AlertTriangle, ArrowRight } from 'lucide-react';

interface OrderHistoryProps {
  currentUser: User | null;
  config: VulnerabilityConfig;
  onOpenAuth: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  currentUser,
  config,
  onOpenAuth
}) => {
  const [lookupId, setLookupId] = useState('ORD-7777');
  const [inspectedOrder, setInspectedOrder] = useState<{
    order?: Order;
    status: number;
    message: string;
    isIdorVulnerability: boolean;
  } | null>(null);

  const orders = storeService.getOrders();
  const myOrders = currentUser
    ? orders.filter(o => o.userId === currentUser.id)
    : [];

  const handleLookup = (id: string) => {
    setLookupId(id);
    const result = storeService.getOrderById(id, currentUser, config);
    setInspectedOrder(result);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Order History</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review dispatch records and test Insecure Direct Object References on order resources.
        </p>
      </div>

      {/* IDOR Order Inspector */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              A01: Insecure Direct Object Reference (Order API)
            </h3>
          </div>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
            config.a01_broken_access
              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}>
            {config.a01_broken_access ? 'Vulnerable (/api/orders/:id)' : 'Access Controlled'}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Try requesting order numbers belonging to other users (e.g. VIP order <code className="text-indigo-300 font-mono">ORD-7777</code> belonging to the CIO).
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-500">GET /api/orders/</span>
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="w-32 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleLookup(lookupId)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors"
          >
            Fetch Order
          </button>

          <div className="flex items-center gap-1.5 ml-auto text-xs">
            <span className="text-slate-500 text-[11px]">Presets:</span>
            <button
              onClick={() => handleLookup('ORD-1001')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px]"
            >
              ORD-1001 (Alice)
            </button>
            <button
              onClick={() => handleLookup('ORD-1002')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px]"
            >
              ORD-1002 (Bob)
            </button>
            <button
              onClick={() => handleLookup('ORD-7777')}
              className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-mono text-[11px] font-semibold"
            >
              ORD-7777 (CIO VIP)
            </button>
          </div>
        </div>

        {/* Inspected Order Result */}
        {inspectedOrder && (
          <div className="pt-3 border-t border-slate-800">
            {inspectedOrder.isIdorVulnerability ? (
              <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-lg text-xs text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-100">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>IDOR Exploit Succeeded (HTTP 200):</span>
                </div>
                <p>
                  Retrieved order <b>{inspectedOrder.order?.id}</b> placed by <b>{inspectedOrder.order?.customerName}</b> ({inspectedOrder.order?.customerEmail}) totaling <b>${inspectedOrder.order?.total}</b>.
                </p>
                <div className="p-2 bg-black/40 rounded border border-rose-900 font-mono text-[11px]">
                  Shipping: {inspectedOrder.order?.shippingAddress} | Payment: {inspectedOrder.order?.paymentMethod}
                </div>
              </div>
            ) : inspectedOrder.status === 403 ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-xs text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-100">403 Forbidden: </span>
                  <span>Remediation confirmed. Access denied to non-owned order records.</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Status: {inspectedOrder.message}</div>
            )}
          </div>
        )}
      </div>

      {/* Regular User Orders */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Your Associated Orders</h2>
        {!currentUser ? (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
            <Package className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">Please sign in to view your orders list.</p>
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
            >
              Sign In
            </button>
          </div>
        ) : myOrders.length === 0 ? (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
            <p className="text-xs text-slate-400">You have not placed any orders yet.</p>
          </div>
        ) : (
          myOrders.map(order => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{order.id}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{order.createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium text-[11px]">
                    {order.status}
                  </span>
                  <span className="font-bold text-white text-sm">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                <span>Shipping: {order.shippingAddress}</span>
                <span>{order.paymentMethod}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

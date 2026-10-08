import React from 'react';
import { ShieldAlert, ShieldCheck, ShoppingCart, User as UserIcon, Terminal, Search, Sliders, FileText, Bug } from 'lucide-react';
import { User, VulnerabilityConfig } from '../types';

interface HeaderProps {
  currentView: 'store' | 'redteam' | 'zap' | 'report' | 'profile' | 'orders' | 'admin';
  setCurrentView: (view: 'store' | 'redteam' | 'zap' | 'report' | 'profile' | 'orders' | 'admin') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  cartCount: number;
  onOpenCart: () => void;
  config: VulnerabilityConfig;
  onToggleAllVulnerabilities: (vulnerable: boolean) => void;
  onOpenConfigModal: () => void;
  isAllVulnerable: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  onOpenAuth,
  onLogout,
  cartCount,
  onOpenCart,
  config,
  onToggleAllVulnerabilities,
  onOpenConfigModal,
  isAllVulnerable
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Security Banner & Mode Switcher */}
      <div className={`px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b ${
        isAllVulnerable 
          ? 'bg-rose-950/80 border-rose-800/80 text-rose-200' 
          : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold tracking-wide uppercase">
            {isAllVulnerable ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Lab State: Intentionally Vulnerable (OWASP Target)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Lab State: Remediated & Hardened (Secure Mode)</span>
              </>
            )}
          </span>
          <span className="text-slate-400 hidden sm:inline" aria-hidden="true">|</span>
          <span className="text-slate-300 hidden sm:inline">
            {isAllVulnerable 
              ? 'A01, A03, A05, A06, A07, A09 vulnerabilities active for Red Team & ZAP testing' 
              : 'Parameterized queries, strict RBAC, CSP headers, patched dependencies active'}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            onClick={() => onToggleAllVulnerabilities(!isAllVulnerable)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              isAllVulnerable
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
            }`}
            title="Toggle application between Vulnerable Lab and Patched Production state"
          >
            {isAllVulnerable ? 'Switch to Hardened (Fixed)' : 'Switch to Vulnerable (Lab)'}
          </button>
          
          <button
            onClick={onOpenConfigModal}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
            title="Customize individual vulnerability settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Vuln Matrix</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('store')}
              className="flex items-center gap-2 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow font-black tracking-tighter text-lg group-hover:bg-indigo-500 transition-colors">
                SS
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-white">SecureShop</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700 font-mono">
                    v1.0.4-lab
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Internal E-Commerce & AppSec Target</p>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setCurrentView('store')}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentView === 'store'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Storefront
            </button>
            <button
              onClick={() => setCurrentView('redteam')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                currentView === 'redteam'
                  ? 'bg-rose-950/70 text-rose-300 border border-rose-800 font-semibold'
                  : 'text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/40'
              }`}
            >
              <Terminal className="w-4 h-4 text-rose-400" />
              <span>Red Team Sandbox</span>
            </button>
            <button
              onClick={() => setCurrentView('zap')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                currentView === 'zap'
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800 font-semibold'
                  : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/40'
              }`}
            >
              <Bug className="w-4 h-4 text-amber-400" />
              <span>OWASP ZAP DAST</span>
            </button>
            <button
              onClick={() => setCurrentView('report')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
                currentView === 'report'
                  ? 'bg-blue-950/70 text-blue-300 border border-blue-800 font-semibold'
                  : 'text-blue-300/80 hover:text-blue-200 hover:bg-blue-950/40'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Investigation & Report</span>
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-3 py-2 rounded-md transition-colors ${
                currentView === 'admin'
                  ? 'bg-purple-950/70 text-purple-300 border border-purple-800 font-semibold'
                  : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/40'
              }`}
            >
              Admin Area
            </button>
          </nav>

          {/* User Controls & Cart */}
          <div className="flex items-center gap-2">
            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors ${
                    currentView === 'profile'
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="View user profile (IDOR testable)"
                >
                  <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="max-w-[110px] truncate">{currentUser.name.split(' ')[0]}</span>
                  {currentUser.role === 'admin' && (
                    <span className="text-[10px] px-1 py-0.2 bg-purple-900 text-purple-200 rounded">Admin</span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentView('orders')}
                  className="hidden sm:inline-flex px-2 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  Orders
                </button>

                <button
                  onClick={onLogout}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-rose-300 transition-colors"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors shadow-sm"
              >
                Sign In / Register
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
              aria-label="View shopping cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 text-xs border-t border-slate-800">
          <button
            onClick={() => setCurrentView('store')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${currentView === 'store' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            Storefront
          </button>
          <button
            onClick={() => setCurrentView('redteam')}
            className={`px-2.5 py-1 rounded whitespace-nowrap text-rose-300 ${currentView === 'redteam' ? 'bg-rose-950/80 border border-rose-800' : ''}`}
          >
            Red Team Sandbox
          </button>
          <button
            onClick={() => setCurrentView('zap')}
            className={`px-2.5 py-1 rounded whitespace-nowrap text-amber-300 ${currentView === 'zap' ? 'bg-amber-950/80 border border-amber-800' : ''}`}
          >
            OWASP ZAP Scanner
          </button>
          <button
            onClick={() => setCurrentView('report')}
            className={`px-2.5 py-1 rounded whitespace-nowrap text-blue-300 ${currentView === 'report' ? 'bg-blue-950/80 border border-blue-800' : ''}`}
          >
            Investigation Report
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`px-2.5 py-1 rounded whitespace-nowrap text-purple-300 ${currentView === 'admin' ? 'bg-purple-950/80 border border-purple-800' : ''}`}
          >
            Admin Panel
          </button>
        </div>
      </div>
    </header>
  );
};

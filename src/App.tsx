/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProductList } from './components/ProductList';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { OrderHistory } from './components/OrderHistory';
import { AdminPanel } from './components/AdminPanel';
import { RedTeamWorkbench } from './components/RedTeamWorkbench';
import { ZAPScannerModal } from './components/ZAPScannerModal';
import { AssignmentReportModal } from './components/AssignmentReportModal';
import { VulnerabilitySettingsModal } from './components/VulnerabilitySettingsModal';

import { Product, User, VulnerabilityConfig } from './types';
import { storeService, DEFAULT_VULNERABILITY_CONFIG } from './services/storeService';
import { INITIAL_USERS } from './data/mockData';
import { ShieldCheck, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function App() {
  // Navigation View
  const [currentView, setCurrentView] = useState<'store' | 'redteam' | 'zap' | 'report' | 'profile' | 'orders' | 'admin'>('store');

  // Vulnerability Lab State (Default: All Vulnerabilities Active for Lab / OWASP ZAP testing)
  const [config, setConfig] = useState<VulnerabilityConfig>(DEFAULT_VULNERABILITY_CONFIG);

  // Authenticated User (Defaulted to Alice Smith for instant IDOR and Cart access)
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Store Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Run Search Query via Store Engine
  const searchResult = storeService.searchProducts(searchQuery, selectedCategory, config);

  // Add to Cart
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${quantity}x "${product.name}" to cart`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.product.id === productId ? { ...item, quantity } : item)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = (address: string, creditCard: string) => {
    if (!currentUser) return;
    const order = storeService.createOrder(currentUser, cartItems, address, creditCard, config);
    setCartItems([]);
    setIsCartOpen(false);
    showToast(`Order #${order.id} placed successfully!`);
    setCurrentView('orders');
  };

  // Toggle All Vulnerabilities (Vulnerable Lab Mode vs Hardened Remediated Mode)
  const isAllVulnerable = Object.values(config).every(Boolean);

  const handleToggleAll = (makeVulnerable: boolean) => {
    setConfig({
      a01_broken_access: makeVulnerable,
      a03_injection_sqli: makeVulnerable,
      a03_injection_xss: makeVulnerable,
      a05_security_misconfig: makeVulnerable,
      a06_outdated_component: makeVulnerable,
      a07_auth_session_weakness: makeVulnerable,
      a09_logging_failure: makeVulnerable
    });
    showToast(
      makeVulnerable
        ? 'Lab Mode Active: All 6 OWASP vulnerability categories enabled.'
        : 'Hardened Mode Active: Parameterized queries, strict RBAC, and CSP headers applied.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-indigo-500/80 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Navigation Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Signed out of session');
        }}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        config={config}
        onToggleAllVulnerabilities={handleToggleAll}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        isAllVulnerable={isAllVulnerable}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'store' && (
          <ProductList
            products={searchResult.products}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            config={config}
            executedQuery={searchResult.executedQuery}
            isSqliHit={searchResult.isVulnerableHit}
            sqliExplanation={searchResult.explanation}
          />
        )}

        {currentView === 'redteam' && (
          <RedTeamWorkbench
            currentUser={currentUser}
            config={config}
            onNavigateToStore={() => setCurrentView('store')}
            onNavigateToAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'zap' && (
          <ZAPScannerModal
            config={config}
            onOpenReport={() => setCurrentView('report')}
            onToggleToRemediated={() => handleToggleAll(false)}
            onToggleToVulnerable={() => handleToggleAll(true)}
          />
        )}

        {currentView === 'report' && (
          <AssignmentReportModal
            config={config}
          />
        )}

        {currentView === 'profile' && (
          <UserProfile
            currentUser={currentUser}
            config={config}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentView === 'orders' && (
          <OrderHistory
            currentUser={currentUser}
            config={config}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            currentUser={currentUser}
            config={config}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
        currentUser={currentUser}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        config={config}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Logged in as ${user.name} (${user.role})`);
        }}
        config={config}
      />

      <VulnerabilitySettingsModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onUpdateConfig={(newCfg) => {
          setConfig(newCfg);
          showToast('Updated vulnerability matrix switches');
        }}
      />

      {/* Educational Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SecureShop Security Laboratory</span>
            <span>·</span>
            <span>OWASP ZAP DAST Testing Target & Red Team Workbench</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Compliant with OWASP Top 10 (2021)</span>
            <span>·</span>
            <span>Target: http://localhost:3000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

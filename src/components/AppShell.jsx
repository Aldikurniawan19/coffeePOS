import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { 
  Coffee, 
  LayoutDashboard, 
  MonitorSpeaker, 
  Box, 
  Tags, 
  UserCheck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Clock, 
  Bell, 
  Plus,
  Loader2,
  Menu,
  X
} from 'lucide-react';

import DashboardView from './DashboardView';
import POSView from './POSView';
import ProductsView from './ProductsView';
import CategoriesView from './CategoriesView';
import StaffView from './StaffView';
import ReportsView from './ReportsView';
import SettingsView from './SettingsView';

// Menu definitions with role access
const allMenuItems = [
  // --- Operasional ---
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Operasional', roles: ['owner'],
    title: 'Dashboard Performa Toko', subtitle: 'Ringkasan penjualan dan performa coffee shop hari ini.' },
  { id: 'pos', label: 'Kasir / POS', icon: MonitorSpeaker, section: 'Operasional', roles: ['kasir', 'owner', 'barista'],
    title: 'Kasir Coffee POS', subtitle: 'Pilih menu kopi/makanan, barista, dan proses pembayaran.' },
  // --- Katalog ---
  { id: 'products', label: 'Menu & Produk', icon: Box, section: 'Katalog', roles: ['kasir', 'owner'],
    title: 'Daftar Menu & Produk', subtitle: 'Kelola menu minuman, makanan, harga, dan gambar produk.' },
  { id: 'categories', label: 'Kategori Menu', icon: Tags, section: 'Katalog', roles: ['kasir', 'owner'],
    title: 'Kategori Menu', subtitle: 'Kelola pengelompokan jenis minuman & makanan.' },
  // --- Manajemen ---
  { id: 'staff', label: 'Staff & Barista', icon: UserCheck, section: 'Manajemen', roles: ['owner'], badge: true,
    title: 'Manajemen Staff & Barista', subtitle: 'Kelola data tim barista, kasir, dan performa staff.' },
  // --- Analisa & Sistem ---
  { id: 'reports', label: 'Laporan', icon: BarChart3, section: 'Analisa & Sistem', roles: ['owner'],
    title: 'Laporan Penjualan', subtitle: 'Laporan transaksi harian, bulanan, dan ringkasan omzet.' },
  { id: 'settings', label: 'Pengaturan', icon: Settings, section: 'Analisa & Sistem', roles: ['owner'],
    title: 'Pengaturan Coffee Shop', subtitle: 'Pengaturan nama outlet, alamat, dan struk thermal.' },
];

export default function AppShell({ user }) {
  const userRole = user?.role || 'kasir';
  const userName = user?.name || 'User';

  // Filter menu items by role
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  // Set default view based on role
  const defaultView = userRole === 'owner' ? 'dashboard' : 'pos';
  const defaultItem = menuItems.find(m => m.id === defaultView) || menuItems[0];

  const [activeView, setActiveView] = useState(defaultItem.id);
  const [pageTitle, setPageTitle] = useState(defaultItem.title);
  const [pageSubtitle, setPageSubtitle] = useState(defaultItem.subtitle);
  const [liveTime, setLiveTime] = useState('');
  const [keyCounter, setKeyCounter] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (viewId, title, subtitle) => {
    setActiveView(viewId);
    setPageTitle(title);
    setPageSubtitle(subtitle);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleTransactionDone = () => {
    // Refresh dashboard stats when transaction is completed
    setKeyCounter(prev => prev + 1);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    window.location.href = '/login';
  };

  // Group menu items by section
  const sections = [];
  let currentSection = null;
  for (const item of menuItems) {
    if (item.section !== currentSection) {
      currentSection = item.section;
      sections.push({ label: currentSection, items: [] });
    }
    sections[sections.length - 1].items.push(item);
  }

  const roleLabel = userRole === 'owner' ? 'Owner / Manager' : userRole === 'barista' ? 'Barista' : 'Kasir';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background relative">
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid #E2E8F0',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#fff' },
            style: { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
            style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
          },
        }}
      />

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 bg-card border-r border-border flex flex-col shrink-0 z-40 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
        isSidebarOpen 
          ? 'w-[260px] translate-x-0 opacity-100' 
          : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden lg:border-r-0'
      }`}>
        {/* Brand Header */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-border min-w-[260px]">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-xl tracking-tight">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            CoffeePOS
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-secondary hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Sembunyikan Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 min-w-[260px]">
          {sections.map((section, sIdx) => (
            <React.Fragment key={section.label}>
              <p className={`px-3 text-[11px] font-bold text-secondary uppercase tracking-widest mb-2 ${sIdx > 0 ? 'mt-6' : ''}`}>
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id, item.title, item.subtitle)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                      activeView === item.id ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-secondary hover:bg-slate-50 hover:text-text'
                    }`}
                  >
                    <Icon className="w-5 h-5" /> {item.label}
                    {item.badge && (
                      <span className="absolute right-3 w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-border bg-slate-50/50 min-w-[260px]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border border-border flex items-center justify-center font-bold ${
              userRole === 'owner' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{userName}</p>
              <p className="text-xs text-secondary truncate">{roleLabel}</p>
            </div>
            <button 
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-1.5 text-secondary hover:text-danger rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Logout"
            >
              {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
        {/* Top Header */}
        <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-2 text-secondary hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">{pageTitle}</h1>
              <p className="text-xs text-secondary hidden sm:block">{pageSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Clock */}
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-secondary mr-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-border">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{liveTime}</span>
            </div>

            <button className="relative p-2 text-secondary hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger border-2 border-card rounded-full"></span>
            </button>
            
            {menuItems.some(m => m.id === 'pos') && (
              <button 
                onClick={() => navigate('pos', 'Kasir (POS)', 'Pilih menu kopi/makanan, barista, dan proses pembayaran.')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Order Baru</span>
              </button>
            )}
          </div>
        </header>

        {/* View Section Router */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeView === 'dashboard' && (
            <DashboardView 
              key={keyCounter}
              onNavigatePOS={() => navigate('pos', 'Kasir (POS)', 'Pilih menu kopi/makanan, barista, dan proses pembayaran.')}
              onNavigateReports={() => navigate('reports', 'Laporan Penjualan', 'Ringkasan transaksi dan pendapatan toko.')}
              onNavigateStaff={() => navigate('staff', 'Manajemen Staff & Barista', 'Kelola data tim barista, kasir, dan performa staff.')} 
            />
          )}
          {activeView === 'pos' && (
            <POSView onTransactionComplete={handleTransactionDone} />
          )}
          {activeView === 'products' && <ProductsView />}
          {activeView === 'categories' && <CategoriesView />}
          {activeView === 'staff' && <StaffView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

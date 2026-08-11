import React, { useState, useEffect } from 'react';
import { Wallet, Coffee, Utensils, ShoppingBag, TrendingUp, TrendingDown, BarChart2, Calendar, Filter, ArrowRight } from 'lucide-react';

export default function DashboardView({ onNavigatePOS, onNavigateReports, onNavigateStaff }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('week'); // 'week' or 'month'

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/reports');
      const result = await res.json();
      setData(result);
      setLoading(false);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-secondary">Memuat data dashboard coffee shop...</div>;
  }

  const { 
    totalRevenue = 0, 
    itemsSold = 0, 
    drinksSold = 0, 
    foodSold = 0, 
    transactions = [], 
    staffSummary = [],
    weeklyChartData = [],
    monthlyChartData = []
  } = data || {};

  const activeChartData = chartFilter === 'week' ? weeklyChartData : monthlyChartData;
  const maxRevenue = Math.max(...activeChartData.map(item => item.revenue), 100000);

  // Period filtering & dynamic stats calculation based on chartFilter
  const now = new Date();
  const periodDays = chartFilter === 'week' ? 7 : 30;
  const periodLabel = chartFilter === 'week' ? '7 hari terakhir' : '30 hari terakhir';
  const prevPeriodLabel = chartFilter === 'week' ? '7 hari sebelumnya' : '30 hari sebelumnya';

  const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const prevCutoff = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

  const currentTxs = transactions.filter(tx => new Date(tx.createdAt) >= cutoff);
  const prevTxs = transactions.filter(tx => {
    const d = new Date(tx.createdAt);
    return d >= prevCutoff && d < cutoff;
  });

  const activeTxs = currentTxs.length > 0 ? currentTxs : transactions;

  const cardRevenue = activeTxs.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
  const prevRevenue = prevTxs.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);

  let growthPercent = 0;
  if (prevRevenue > 0) {
    growthPercent = Math.round(((cardRevenue - prevRevenue) / prevRevenue) * 100);
  } else if (cardRevenue > 0 && prevRevenue === 0) {
    growthPercent = 100;
  }

  let cardDrinks = 0;
  let cardFood = 0;
  let cardTotalItems = 0;

  activeTxs.forEach(tx => {
    (tx.items || []).forEach(item => {
      cardTotalItems += (item.qty || 0);
      if (item.type === 'Minuman' || item.type === 'Jasa') {
        cardDrinks += (item.qty || 0);
      } else if (item.type === 'Makanan' || item.type === 'Barang') {
        cardFood += (item.qty || 0);
      }
    });
  });

  return (
    <div className="flex-1 flex-col overflow-y-auto p-4 sm:p-6 space-y-6 bg-white">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Total Pendapatan */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <p className="text-sm font-medium text-secondary">Total Pendapatan</p>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><Wallet className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-bold text-text relative">Rp {cardRevenue.toLocaleString('id-ID')}</h3>
          <div className="mt-3 flex items-center text-xs font-medium relative">
            {growthPercent >= 0 ? (
              <span className="flex items-center text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> +{growthPercent}% vs {prevPeriodLabel}
              </span>
            ) : (
              <span className="flex items-center text-rose-500">
                <TrendingDown className="w-3.5 h-3.5 mr-1" /> {growthPercent}% vs {prevPeriodLabel}
              </span>
            )}
          </div>
        </div>

        {/* Stat 2: Minuman Terjual */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <p className="text-sm font-medium text-secondary">Minuman Terjual</p>
            <div className="p-2 bg-sky-50 text-sky-700 rounded-lg"><Coffee className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-bold text-text relative">{cardDrinks} <span className="text-sm font-normal text-secondary">cup</span></h3>
          <div className="mt-3 flex items-center text-xs text-secondary font-medium relative">
            Total {periodLabel}
          </div>
        </div>

        {/* Stat 3: Makanan / Pastry Terjual */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <p className="text-sm font-medium text-secondary">Makanan & Pastry</p>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg"><Utensils className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-bold text-text relative">{cardFood} <span className="text-sm font-normal text-secondary">porsi</span></h3>
          <div className="mt-3 flex items-center text-xs text-secondary font-medium relative">
            Total porsi {periodLabel}
          </div>
        </div>

        {/* Stat 4: Total Item Terjual */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-2 relative">
            <p className="text-sm font-medium text-secondary">Total Item Terjual</p>
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg"><ShoppingBag className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-bold text-text relative">{cardTotalItems} <span className="text-sm font-normal text-secondary">items</span></h3>
          <div className="mt-3 flex items-center text-xs text-secondary font-medium relative">
            Total unit terjual {periodLabel}
          </div>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-card rounded-xl shadow-card border border-border p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-base font-semibold text-text flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Grafik Omset Penjualan
            </h3>
            <p className="text-xs text-secondary mt-0.5">Analisa omset coffee shop berdasarkan periode ({periodLabel})</p>
          </div>

          {/* Filter Controls */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-border">
            <button 
              onClick={() => setChartFilter('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartFilter === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-secondary hover:text-text'
              }`}
            >
              Per Minggu (7 Hari)
            </button>
            <button 
              onClick={() => setChartFilter('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartFilter === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-secondary hover:text-text'
              }`}
            >
              Per Bulan (4 Minggu)
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-border">
          {activeChartData.map((item, idx) => {
            const heightPercent = Math.max(10, Math.round((item.revenue / maxRevenue) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 bg-slate-900 text-white text-[11px] font-bold py-1 px-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  Rp {item.revenue.toLocaleString('id-ID')} ({item.txCount || 0} order)
                </div>

                {/* Value Label */}
                <span className="text-[10px] font-bold text-secondary mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Rp {(item.revenue / 1000).toFixed(0)}k
                </span>

                {/* Animated Bar */}
                <div 
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md group-hover:from-blue-800 group-hover:to-blue-600 transition-all duration-300 relative shadow-sm"
                >
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between gap-2 sm:gap-4 pt-3 px-2">
          {activeChartData.map((item, idx) => (
            <div key={idx} className="flex-1 text-center text-xs font-medium text-secondary truncate">
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (Limited to 5 items) */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-card border border-border flex flex-col min-h-[380px]">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-text">Pesanan Terakhir</h3>
              <p className="text-xs text-secondary mt-0.5">5 transaksi terbaru di kasir</p>
            </div>
            <div className="flex items-center gap-3">
              {onNavigateReports && (
                <button 
                  onClick={onNavigateReports} 
                  className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"
                >
                  Lihat Semua Laporan <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs text-secondary sticky top-0">
                <tr>
                  <th className="p-3 font-medium rounded-tl-lg">Waktu</th>
                  <th className="p-3 font-medium">Pemesan</th>
                  <th className="p-3 font-medium">Staff</th>
                  <th className="p-3 font-medium">Menu</th>
                  <th className="p-3 font-medium text-right rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border">
                {transactions.slice(0, 5).map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-secondary text-xs">{new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3 font-medium text-text">
                      {tx.customerName || 'Walk-in'}
                      {tx.tableNumber ? <span className="text-xs text-blue-700 block">{tx.tableNumber}</span> : null}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                        {tx.staffName || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-secondary text-xs">
                      {tx.items?.map(i => i.name).join(', ')}
                    </td>
                    <td className="p-3 text-right font-medium text-text">
                      Rp {tx.totalAmount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-secondary">Belum ada pesanan pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {transactions.length > 5 && (
            <div className="p-3 border-t border-border bg-slate-50/60 text-center">
              <button 
                onClick={onNavigateReports} 
                className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                Lihat Semua ({transactions.length} Transaksi) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Staff Performance */}
        <div className="bg-card rounded-xl shadow-card border border-border flex flex-col min-h-[380px]">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-text">Performa Staff & Barista</h3>
              <p className="text-xs text-secondary mt-0.5">Penjualan per staff</p>
            </div>
            {onNavigateReports && (
              <button 
                onClick={onNavigateReports} 
                className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {staffSummary.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-border flex items-center justify-center text-blue-700 font-bold">
                  {s.name.substring(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{s.name}</p>
                  <p className="text-xs text-secondary truncate">{s.role || 'Barista'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-700">Rp {(s.totalSales || 0).toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-secondary">{s.txCount || 0} Order</p>
                </div>
              </div>
            ))}
            {staffSummary.length === 0 && (
              <div className="text-center py-6 text-secondary text-sm">Belum ada data staff.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

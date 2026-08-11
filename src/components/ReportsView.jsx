import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Banknote, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';

const ITEMS_PER_PAGE = 10;

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Filter States
  const [preset, setPreset] = useState('month'); // 'today', '7days', 'month', 'all', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination States
  const [salesPage, setSalesPage] = useState(1);
  const [commPage, setCommPage] = useState(1);

  // Set initial default dates based on preset
  useEffect(() => {
    applyPreset('month');
  }, []);

  // Refetch when dates change & reset page
  useEffect(() => {
    setSalesPage(1);
    setCommPage(1);
    fetchReportData();
  }, [startDate, endDate]);

  const applyPreset = (selectedPreset) => {
    setPreset(selectedPreset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (selectedPreset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (selectedPreset === '7days') {
      const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (selectedPreset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const year = startOfMonth.getFullYear();
      const month = String(startOfMonth.getMonth() + 1).padStart(2, '0');
      const day = String(startOfMonth.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
      setEndDate(todayStr);
    } else if (selectedPreset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error('Fetch report error:', e);
    } finally {
      setLoading(false);
    }
  };

  const {
    transactions = [],
    barberSummary = [],
    staffSummary = [],
    totalRevenue = 0,
    totalCommission = 0,
    shopInfo = { shopName: 'Coffee POS', address: 'Jl. Kopi No. 123, Jakarta' }
  } = data || {};

  const activeStaffSummary = staffSummary.length > 0 ? staffSummary : barberSummary;

  // Pagination Slice
  const totalSalesPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const currentSalesData = transactions.slice((salesPage - 1) * ITEMS_PER_PAGE, salesPage * ITEMS_PER_PAGE);

  const totalCommPages = Math.ceil(activeStaffSummary.length / ITEMS_PER_PAGE);
  const currentCommData = activeStaffSummary.slice((commPage - 1) * ITEMS_PER_PAGE, commPage * ITEMS_PER_PAGE);

  // Formatted Label for Reports / Filenames
  const getDateLabel = () => {
    if (preset === 'today') return `Hari Ini (${startDate})`;
    if (preset === '7days') return `7 Hari Terakhir (${startDate} s.d ${endDate})`;
    if (preset === 'month') return `Bulan Ini (${startDate} s.d ${endDate})`;
    if (preset === 'all') return 'Semua Tanggal';
    if (startDate && endDate) return `${startDate} s.d ${endDate}`;
    if (startDate) return `Sejak ${startDate}`;
    if (endDate) return `Hingga ${endDate}`;
    return 'Semua Tanggal';
  };

  const handleExportExcel = () => {
    exportToExcel({
      transactions,
      staffSummary: activeStaffSummary,
      totalRevenue,
      totalCommission,
      dateLabel: getDateLabel(),
      shopName: shopInfo.shopName || 'Coffee POS'
    });
  };

  const handleExportPDF = () => {
    exportToPDF({
      transactions,
      staffSummary: activeStaffSummary,
      totalRevenue,
      totalCommission,
      dateLabel: getDateLabel(),
      shopInfo
    });
  };

  return (
    <div className="flex-1 flex-col overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-accent" />
            Laporan & Analisa
          </h2>
          <p className="text-sm text-secondary mt-1">
            Laporan riwayat transaksi, grafik pendapatan & rincian komisi staff/barista.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Filter className="w-4 h-4 text-accent" />
            <span>Filter Tanggal Laporan:</span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari Terakhir' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'all', label: 'Semua' },
              { id: 'custom', label: 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  preset === p.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                    : 'bg-white border-border text-secondary hover:bg-slate-50 hover:text-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-medium text-secondary whitespace-nowrap">Dari Tanggal:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPreset('custom');
                setStartDate(e.target.value);
              }}
              className="w-full sm:w-auto px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-medium text-secondary whitespace-nowrap">Sampai Tanggal:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPreset('custom');
                setEndDate(e.target.value);
              }}
              className="w-full sm:w-auto px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="ml-auto text-xs text-secondary font-medium">
            Periode Aktif: <span className="text-text font-bold">{getDateLabel()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'sales'
              ? 'text-accent border-accent font-semibold'
              : 'text-secondary border-transparent hover:text-text'
          }`}
        >
          Riwayat Penjualan ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('commission')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'commission'
              ? 'text-accent border-accent font-semibold'
              : 'text-secondary border-transparent hover:text-text'
          }`}
        >
          Komisi & Bagi Hasil Staff
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-secondary flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-accent" />
          <span>Memuat data laporan...</span>
        </div>
      ) : activeTab === 'sales' ? (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-border flex justify-between items-center">
            <span className="text-xs font-bold text-secondary uppercase">Ringkasan Total Omset</span>
            <span className="text-lg font-bold text-accent">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-secondary text-xs uppercase border-b border-border font-bold">
                <tr>
                  <th className="p-4">Kode TRX</th>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Staff / Barista</th>
                  <th className="p-4">Metode</th>
                  <th className="p-4 text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentSalesData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono font-medium text-text">{tx.code}</td>
                    <td className="p-4 text-secondary">
                      {new Date(tx.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-text font-medium">{tx.customerName || 'Walk-in'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-50 text-accent text-xs rounded-md font-medium">
                        {tx.barberName || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-secondary font-medium">{tx.paymentMethod}</td>
                    <td className="p-4 text-right font-bold text-text">
                      Rp {tx.totalAmount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-secondary">
                      Tidak ada data transaksi pada rentang tanggal ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Sales */}
          {transactions.length > ITEMS_PER_PAGE && (
            <div className="p-4 bg-slate-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary font-medium">
              <div>
                Menampilkan <span className="font-bold text-text">{(salesPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-text">{Math.min(salesPage * ITEMS_PER_PAGE, transactions.length)}</span> dari <span className="font-bold text-text">{transactions.length}</span> transaksi
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSalesPage(p => Math.max(p - 1, 1))}
                  disabled={salesPage === 1}
                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-card text-text transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalSalesPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setSalesPage(page)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      salesPage === page
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-card border border-border text-secondary hover:text-text hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setSalesPage(p => Math.min(p + 1, totalSalesPages))}
                  disabled={salesPage === totalSalesPages}
                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-card text-text transition-colors"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden p-6 space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-border">
            <div>
              <p className="text-xs font-bold text-secondary uppercase">Total Komisi Yang Harus Dibayarkan</p>
              <h3 className="text-2xl font-bold text-rose-600">Rp {totalCommission.toLocaleString('id-ID')}</h3>
            </div>
            <Banknote className="w-8 h-8 text-rose-600 opacity-60" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-[11px] font-bold text-secondary uppercase">
                  <th className="p-4">Nama Staff</th>
                  <th className="p-4">Kode</th>
                  <th className="p-4">Skema Komisi</th>
                  <th className="p-4">Total Omset Dihasilkan</th>
                  <th className="p-4 text-right">Hak Komisi Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentCommData.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-text">{b.name}</td>
                    <td className="p-4 font-mono text-secondary">{b.code}</td>
                    <td className="p-4 text-xs text-secondary">
                      Jasa: {b.commissionCut}% | Produk: {b.commissionProduct}%
                    </td>
                    <td className="p-4 font-medium text-text">Rp {b.totalSales.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right font-bold text-emerald-600 text-base">
                      Rp {b.totalComm.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {activeStaffSummary.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-secondary">
                      Tidak ada data komisi staff pada rentang tanggal ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for Staff Commission */}
          {activeStaffSummary.length > ITEMS_PER_PAGE && (
            <div className="p-4 bg-slate-50 border border-border rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary font-medium">
              <div>
                Menampilkan <span className="font-bold text-text">{(commPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-text">{Math.min(commPage * ITEMS_PER_PAGE, activeStaffSummary.length)}</span> dari <span className="font-bold text-text">{activeStaffSummary.length}</span> staff
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCommPage(p => Math.max(p - 1, 1))}
                  disabled={commPage === 1}
                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-card text-text transition-colors"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalCommPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCommPage(page)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      commPage === page
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-card border border-border text-secondary hover:text-text hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCommPage(p => Math.min(p + 1, totalCommPages))}
                  disabled={commPage === totalCommPages}
                  className="p-1.5 rounded-lg border border-border bg-card hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-card text-text transition-colors"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

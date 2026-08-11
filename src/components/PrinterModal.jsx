import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Printer, 
  Bluetooth, 
  Usb, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Power, 
  FileText, 
  Loader2,
  Smartphone,
  Monitor
} from 'lucide-react';
import { printerService } from '../lib/printerService';

export default function PrinterModal({ isOpen, onClose }) {
  const [status, setStatus] = useState(printerService.getStatus());
  const [connectingBt, setConnectingBt] = useState(false);
  const [connectingUsb, setConnectingUsb] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);
  const [shopInfo, setShopInfo] = useState({ shopName: '', address: '' });

  useEffect(() => {
    const unsubscribe = printerService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    fetchShopInfo();
    return () => unsubscribe();
  }, []);

  const fetchShopInfo = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        setShopInfo({ shopName: data.shopName, address: data.address });
      }
    } catch (e) {
      // ignore
    }
  };

  if (!isOpen) return null;

  const isBtSupported = printerService.isBluetoothSupported();
  const isUsbSupported = printerService.isUsbSupported();

  const handleConnectBt = async () => {
    setConnectingBt(true);
    try {
      const res = await printerService.connectBluetooth();
      toast.success(`Printer Bluetooth "${res.deviceName}" berhasil terhubung!`);
    } catch (err) {
      if (err.name !== 'NotFoundError') { // ignore user cancel
        toast.error(err.message || "Gagal menghubungkan printer Bluetooth.");
      }
    } finally {
      setConnectingBt(false);
    }
  };

  const handleConnectUsb = async () => {
    setConnectingUsb(true);
    try {
      const res = await printerService.connectUsb();
      toast.success(`Printer USB "${res.deviceName}" berhasil terhubung!`);
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        toast.error(err.message || "Gagal menghubungkan printer USB.");
      }
    } finally {
      setConnectingUsb(false);
    }
  };

  const handleDisconnect = async () => {
    await printerService.disconnect();
    toast.success("Koneksi printer telah diputuskan.");
  };

  const handleTestPrint = async () => {
    setTestingPrint(true);
    try {
      await printerService.testPrint(shopInfo);
      toast.success("Perintah cetak pengujian berhasil dikirim!");
    } catch (err) {
      toast.error(err.message || "Gagal mencetak struk uji coba.");
    } finally {
      setTestingPrint(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-border bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 text-accent rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Pengaturan Printer Thermal</h3>
              <p className="text-xs text-secondary">Bluetooth (Android) & WebUSB (PC)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-danger p-1.5 bg-white rounded-lg border border-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Active Connection Status Card */}
          <div className={`p-4 rounded-xl border ${
            status.isConnected 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
              : 'bg-slate-50 border-border text-secondary'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {status.isConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text">
                      {status.isConnected ? status.deviceName : 'Printer Belum Terhubung'}
                    </span>
                    {status.isConnected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                        {status.connectionType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    {status.isConnected 
                      ? 'Siap mencetak struk transaksi' 
                      : 'Pilih koneksi Bluetooth atau USB di bawah ini'}
                  </p>
                </div>
              </div>

              {status.isConnected && (
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 bg-white text-danger border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1 shrink-0"
                >
                  <Power className="w-3.5 h-3.5" /> Putus
                </button>
              )}
            </div>
          </div>

          {/* Connection Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
              Pilih Koneksi Perangkat
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bluetooth Button */}
              <button
                onClick={handleConnectBt}
                disabled={connectingBt || !isBtSupported}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between relative ${
                  status.connectionType === 'bluetooth' && status.isConnected
                    ? 'border-accent bg-blue-50/50'
                    : 'border-border bg-white hover:border-accent'
                } ${!isBtSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 text-accent rounded-lg">
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-secondary">
                    <Smartphone className="w-3 h-3" /> Android
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text">Web Bluetooth</h4>
                  <p className="text-[11px] text-secondary mt-0.5">
                    {isBtSupported ? 'Untuk Smartphone / Tablet' : 'Tidak didukung di browser ini'}
                  </p>
                </div>

                {connectingBt && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-accent">
                    <Loader2 className="w-4 h-4 animate-spin" /> Mencari...
                  </div>
                )}
              </button>

              {/* USB Button */}
              <button
                onClick={handleConnectUsb}
                disabled={connectingUsb || !isUsbSupported}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between relative ${
                  status.connectionType === 'usb' && status.isConnected
                    ? 'border-accent bg-blue-50/50'
                    : 'border-border bg-white hover:border-accent'
                } ${!isUsbSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                    <Usb className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-secondary">
                    <Monitor className="w-3 h-3" /> PC / Laptop
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text">WebUSB</h4>
                  <p className="text-[11px] text-secondary mt-0.5">
                    {isUsbSupported ? 'Kabel USB ke PC' : 'Tidak didukung di browser ini'}
                  </p>
                </div>

                {connectingUsb && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-accent">
                    <Loader2 className="w-4 h-4 animate-spin" /> Menghubungkan...
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider block">
              Pengaturan Cetak
            </h4>

            {/* Auto Print Switch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-border">
              <div>
                <span className="text-sm font-semibold text-text block">Print Otomatis Selesai Transaksi</span>
                <span className="text-xs text-secondary">Cetak struk secara otomatis saat pembayaran berhasil</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox"
                  checked={status.autoPrintEnabled}
                  onChange={(e) => printerService.setAutoPrint(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            {/* Paper Size Selector */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-border">
              <div>
                <span className="text-sm font-semibold text-text block">Ukuran Kertas Thermal</span>
                <span className="text-xs text-secondary">Format lebar baris struk</span>
              </div>
              <select
                value={status.paperWidth}
                onChange={(e) => printerService.setPaperWidth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-semibold text-text focus:outline-none focus:border-accent"
              >
                <option value="58mm">58 mm (Standard)</option>
                <option value="80mm">80 mm (Lebar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border bg-slate-50 flex gap-3 justify-between items-center">
          <button
            onClick={handleTestPrint}
            disabled={!status.isConnected || testingPrint}
            className="px-4 py-2.5 bg-white border border-border text-text font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {testingPrint ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-accent" />}
            Test Print Struk
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-card"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

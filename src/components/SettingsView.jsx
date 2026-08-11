import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, CheckCircle, UserCog, Eye, EyeOff, Shield, ShieldCheck, Pencil, X, Loader2, Printer, Bluetooth, Usb, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react';
import PrinterModal from './PrinterModal';
import { printerService } from '../lib/printerService';

export default function SettingsView() {
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // User accounts state
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', name: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const [printerStatus, setPrinterStatus] = useState(printerService.getStatus());
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    const unsubPrinter = printerService.subscribe((s) => setPrinterStatus(s));
    return () => unsubPrinter();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        setShopName(data.shopName || '');
        setAddress(data.address || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName, address }),
      });
      if (res.ok) {
        toast.success("Pengaturan berhasil diperbarui!");
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 4000);
      } else {
        toast.error("Gagal menyimpan pengaturan.");
      }
    } catch (e) {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setSavingSettings(false);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user.id);
    setEditForm({ username: user.username, name: user.name, password: '' });
    setShowPassword(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ username: '', name: '', password: '' });
    setShowPassword(false);
  };

  const handleSaveUser = async (userId) => {
    if (!editForm.username.trim() || !editForm.name.trim()) {
      toast.error("Username dan nama tidak boleh kosong.");
      return;
    }

    setSavingUser(true);
    try {
      const payload = {
        username: editForm.username.trim(),
        name: editForm.name.trim(),
      };
      if (editForm.password.length > 0) {
        payload.password = editForm.password;
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Akun ${data.role === 'owner' ? 'Owner' : 'Kasir'} berhasil diperbarui!`);
        setEditingUser(null);
        setEditForm({ username: '', name: '', password: '' });
        fetchUsers();
      } else {
        toast.error(data.error || "Gagal menyimpan perubahan akun.");
      }
    } catch (e) {
      toast.error("Gagal menyimpan perubahan akun.");
    } finally {
      setSavingUser(false);
    }
  };

  const ownerUser = users.find(u => u.role === 'owner');
  const kasirUser = users.find(u => u.role === 'kasir');

  return (
    <div className="flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <h2 className="text-xl font-bold text-text mb-6">Pengaturan Usaha</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Shop Settings Card */}
        <div className="bg-card rounded-xl shadow-card border border-border p-6 relative overflow-hidden">
          {savingSettings && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center z-20 gap-2 transition-all">
              <Loader2 className="w-7 h-7 text-accent animate-spin" />
              <span className="text-xs font-semibold text-text">Menyimpan perubahan pengaturan...</span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-5">
            <Save className="w-5 h-5 text-accent" />
            <h3 className="text-base font-semibold text-text">Informasi Coffee Shop</h3>
          </div>

          {isSaved && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Pengaturan berhasil diperbarui!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-text block mb-1">Nama Coffee Shop</label>
              <input 
                type="text" 
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                disabled={savingSettings}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent disabled:opacity-60"
                placeholder="Coffee POS"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1">Alamat Usaha (Untuk Struk Pembayaran)</label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={savingSettings}
                className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent disabled:opacity-60"
                rows={3}
                placeholder="Jl. Sudirman No. 123, Jakarta"
              />
            </div>
            <div className="pt-4 border-t border-border flex justify-end">
              <button 
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Management Card */}
        <div className="bg-card rounded-xl shadow-card border border-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserCog className="w-5 h-5 text-accent" />
            <h3 className="text-base font-semibold text-text">Kelola Akun Pengguna</h3>
          </div>
          <p className="text-xs text-secondary mb-5">Edit username, nama, dan password untuk akun Owner dan Kasir.</p>

          <div className="space-y-4">
            {/* Owner Account */}
            {ownerUser && (
              <UserAccountCard
                user={ownerUser}
                roleLabel="Owner"
                roleIcon={<ShieldCheck className="w-4 h-4" />}
                roleColor="indigo"
                isEditing={editingUser === ownerUser.id}
                editForm={editForm}
                setEditForm={setEditForm}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onStartEdit={() => startEdit(ownerUser)}
                onCancel={cancelEdit}
                onSave={() => handleSaveUser(ownerUser.id)}
                saving={savingUser}
              />
            )}

            {/* Kasir Account */}
            {kasirUser && (
              <UserAccountCard
                user={kasirUser}
                roleLabel="Kasir"
                roleIcon={<Shield className="w-4 h-4" />}
                roleColor="emerald"
                isEditing={editingUser === kasirUser.id}
                editForm={editForm}
                setEditForm={setEditForm}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onStartEdit={() => startEdit(kasirUser)}
                onCancel={cancelEdit}
                onSave={() => handleSaveUser(kasirUser.id)}
                saving={savingUser}
              />
            )}
          </div>
        </div>
      </div>

      {/* Printer Thermal Settings Card */}
      <div className="bg-card rounded-xl shadow-card border border-border p-6 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/10 text-accent rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text">Printer Thermal Struk (ESC/POS)</h3>
              <p className="text-xs text-secondary">Integrasi Web Bluetooth (Android) & WebUSB (PC/Laptop)</p>
            </div>
          </div>
          <button
            onClick={() => setIsPrinterModalOpen(true)}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-card"
          >
            <Settings2 className="w-4 h-4" /> Kelola Printer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-border rounded-xl flex items-center gap-3">
            {printerStatus.isConnected ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-slate-400 shrink-0" />
            )}
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase block">Status Perangkat</span>
              <span className="text-sm font-bold text-text">
                {printerStatus.isConnected ? printerStatus.deviceName : 'Terputus'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-border rounded-xl flex items-center gap-3">
            {printerStatus.connectionType === 'bluetooth' ? (
              <Bluetooth className="w-8 h-8 text-blue-600 shrink-0" />
            ) : (
              <Usb className="w-8 h-8 text-slate-700 shrink-0" />
            )}
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase block">Tipe Koneksi</span>
              <span className="text-sm font-bold text-text">
                {printerStatus.isConnected 
                  ? (printerStatus.connectionType === 'bluetooth' ? 'Web Bluetooth (Android)' : 'WebUSB (PC)')
                  : 'Belum Diatur'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-border rounded-xl flex items-center gap-3">
            <Printer className="w-8 h-8 text-accent shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-secondary uppercase block">Print Otomatis Selesai</span>
              <span className={`text-sm font-bold ${printerStatus.autoPrintEnabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                {printerStatus.autoPrintEnabled ? 'Aktif (Auto-Print ON)' : 'Non-Aktif (Manual)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printer Modal */}
      <PrinterModal 
        isOpen={isPrinterModalOpen} 
        onClose={() => setIsPrinterModalOpen(false)} 
      />
    </div>
  );
}

// Reusable account card component
function UserAccountCard({
  user,
  roleLabel,
  roleIcon,
  roleColor,
  isEditing,
  editForm,
  setEditForm,
  showPassword,
  setShowPassword,
  onStartEdit,
  onCancel,
  onSave,
  saving,
}) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      badge: 'bg-indigo-100 text-indigo-700',
      avatar: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      avatar: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
  };

  const colors = colorMap[roleColor] || colorMap.indigo;

  if (isEditing) {
    return (
      <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-5 animate-fadeIn`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
              {roleIcon} {roleLabel}
            </span>
            <span className="text-xs text-secondary">— Edit Akun</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-secondary hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text block mb-1">Username</label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-accent bg-white"
              placeholder="username"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-accent bg-white"
              placeholder="Nama pengguna"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1">
              Password Baru <span className="text-secondary font-normal">(kosongkan jika tidak ingin mengubah)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full px-4 py-2.5 pr-12 border border-border rounded-lg text-sm focus:outline-none focus:border-accent bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-text transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-text border border-border rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex items-center justify-between hover:shadow-soft transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm ${colors.avatar}`}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text">{user.name}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors.badge}`}>
              {roleIcon} {roleLabel}
            </span>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Username: <span className="font-medium text-text">{user.username}</span>
          </p>
        </div>
      </div>
      <button
        onClick={onStartEdit}
        className="px-3 py-1.5 text-sm font-medium text-accent hover:text-white hover:bg-accent border border-accent/30 rounded-lg transition-colors flex items-center gap-1.5"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>
    </div>
  );
}

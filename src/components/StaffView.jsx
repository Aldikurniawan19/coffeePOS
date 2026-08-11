import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, UserCheck, Coffee } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function StaffView() {
  const [staffList, setStaffList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState('Barista');
  const [status, setStatus] = useState('Active');

  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/barbers');
      const data = await res.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModal = (s = null) => {
    if (s) {
      setEditingId(s.id);
      setName(s.name);
      setCode(s.code);
      setRole(s.role || 'Barista');
      setStatus(s.status);
    } else {
      setEditingId(null);
      setName('');
      setCode('BAR-' + Math.floor(100 + Math.random() * 900));
      setRole('Barista');
      setStatus('Active');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/barbers/${editingId}` : '/api/barbers';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          role,
          status,
        }),
      });
      if (res.ok) {
        toast.success(editingId ? "Data staff berhasil diperbarui!" : "Staff/Barista baru berhasil ditambahkan!");
        setIsModalOpen(false);
        fetchStaff();
      } else {
        toast.error("Gagal menyimpan data staff.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan.");
    }
  };

  const requestDelete = (staff) => {
    setDeleteConfirmItem(staff);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/barbers/${deleteConfirmItem.id}`, { method: 'DELETE' });
      setIsDeleting(false);
      if (res.ok) {
        toast.success("Data staff berhasil dihapus.");
        setDeleteConfirmItem(null);
        fetchStaff();
      } else {
        toast.error("Gagal menghapus data staff.");
      }
    } catch (e) {
      setIsDeleting(false);
      toast.error("Gagal menghapus.");
    }
  };

  return (
    <div className="flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-text">Manajemen Staff & Barista</h2>
          <p className="text-sm text-secondary mt-1">Kelola data barista, kasir, dan status keaktifan tim coffee shop.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Staff Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map(s => (
          <div key={s.id} className="bg-card rounded-xl border border-border shadow-card p-5 relative flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold">
                    {s.name.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">{s.name}</h3>
                    <p className="text-xs text-secondary">ID: {s.code}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                  s.status === 'Active' ? 'bg-green-50 text-success' : 'bg-slate-100 text-secondary'
                }`}>
                  {s.status}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-secondary text-xs">Posisi / Role</p>
                  <p className="font-semibold text-text">{s.role || 'Barista'}</p>
                </div>
                <div>
                  <p className="text-secondary text-xs">Total Order</p>
                  <p className="font-semibold text-text">{s._count?.transactions || 0} Transaksi</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-border">
              <button 
                onClick={() => handleOpenModal(s)}
                className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex justify-center items-center gap-1"
              >
                <Edit2 className="w-4 h-4 text-secondary" /> Edit Data
              </button>
              <button 
                onClick={() => requestDelete(s)}
                className="p-2 border border-border rounded-lg text-sm font-medium hover:bg-red-50 hover:text-danger text-secondary transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-600">
                {editingId ? 'Edit Data Staff' : 'Tambah Staff / Barista Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-danger">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  placeholder="Misal: Alex Barista"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">Kode Staff</label>
                <input 
                  type="text" 
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">Posisi / Role</label>
                <input 
                  type="text" 
                  required
                  placeholder="Head Barista, Barista, atau Kasir"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">Status Keaktifan</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-border text-text rounded-lg text-sm font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal 
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Staff"
        message={`Apakah Anda yakin ingin menghapus staff "${deleteConfirmItem?.name}"? Data yang sudah dihapus tidak dapat dikembalikan.`}
        isLoading={isDeleting}
      />
    </div>
  );
}

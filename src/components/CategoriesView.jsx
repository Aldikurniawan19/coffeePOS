import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function CategoriesView() {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');

  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name);
    } else {
      setEditingId(null);
      setName('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        toast.success(editingId ? "Kategori berhasil diperbarui!" : "Kategori baru berhasil ditambahkan!");
        setIsModalOpen(false);
        fetchCategories();
      } else {
        toast.error("Gagal menyimpan kategori.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan.");
    }
  };

  const requestDelete = (cat) => {
    setDeleteConfirmItem(cat);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteConfirmItem.id}`, { method: 'DELETE' });
      setIsDeleting(false);
      if (res.ok) {
        toast.success("Kategori berhasil dihapus.");
        setDeleteConfirmItem(null);
        fetchCategories();
      } else {
        toast.error("Gagal menghapus kategori.");
      }
    } catch (e) {
      setIsDeleting(false);
      toast.error("Gagal menghapus.");
    }
  };

  return (
    <div className="flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <h2 className="text-xl font-bold text-text mb-6">Kategori Menu</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="bg-card p-5 rounded-xl border border-border shadow-card flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-text">{c.name}</h3>
              <p className="text-xs text-secondary mt-1">{c._count?.products || 0} Layanan / Produk</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenModal(c)} className="text-secondary hover:text-accent p-1">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => requestDelete(c)} className="text-secondary hover:text-danger p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        <div 
          onClick={() => handleOpenModal()}
          className="bg-card p-5 rounded-xl border border-border shadow-card border-dashed bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-center min-h-[80px]"
        >
          <span className="text-sm font-medium text-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Kategori
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-600">
                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-danger">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">Nama Kategori</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
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
        title="Hapus Kategori Menu"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteConfirmItem?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
}

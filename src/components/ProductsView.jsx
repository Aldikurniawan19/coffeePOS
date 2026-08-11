import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, Coffee, Utensils, Package } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Minuman');
  const [stock, setStock] = useState('0');
  const [categoryId, setCategoryId] = useState('');

  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [resP, resC] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json())
    ]);
    setProducts(Array.isArray(resP) ? resP : []);
    setCategories(Array.isArray(resC) ? resC : []);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setName(product.name || '');
      setPrice(product.price ? product.price.toString() : '');
      setImage(product.image || '');
      setDescription(product.description || '');
      setType(product.type || 'Minuman');
      setStock(product.stock !== undefined ? product.stock.toString() : '0');
      setCategoryId(product.categoryId ? product.categoryId.toString() : '');
    } else {
      setEditingId(null);
      setName('');
      setPrice('');
      setImage('');
      setDescription('');
      setType('Minuman');
      setStock('0');
      setCategoryId('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: Number(price),
          image: image || null,
          description: description || null,
          type,
          stock: Number(stock || 0),
          categoryId: categoryId ? Number(categoryId) : null,
        }),
      });
      if (res.ok) {
        toast.success(editingId ? "Menu/Produk berhasil diperbarui!" : "Menu/Produk baru berhasil ditambahkan!");
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error("Gagal menyimpan item.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan.");
    }
  };

  const requestDelete = (product) => {
    setDeleteConfirmItem(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteConfirmItem.id}`, { method: 'DELETE' });
      setIsDeleting(false);
      if (res.ok) {
        toast.success("Produk berhasil dihapus.");
        setDeleteConfirmItem(null);
        fetchData();
      } else {
        toast.error("Gagal menghapus produk.");
      }
    } catch (e) {
      setIsDeleting(false);
      toast.error("Gagal menghapus.");
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? p.type === typeFilter : true;
    return matchSearch && matchType;
  });

  const getTypeBadge = (productType) => {
    switch (productType) {
      case 'Minuman':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Coffee className="w-3 h-3"/> Minuman</span>;
      case 'Makanan':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1 w-fit"><Utensils className="w-3 h-3"/> Makanan</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit"><Package className="w-3 h-3"/> {productType || 'Barang'}</span>;
    }
  };

  return (
    <div className="flex-1 flex-col overflow-y-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-text">Daftar Menu & Produk Coffee Shop</h2>
          <p className="text-sm text-secondary mt-1">Kelola menu minuman, makanan, harga, dan gambar produk.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Menu Baru
        </button>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Cari nama menu / produk..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-border text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
          >
            <option value="">Semua Tipe</option>
            <option value="Minuman">Minuman</option>
            <option value="Makanan">Makanan</option>
            <option value="Barang">Barang / Beans</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-[11px] font-bold text-secondary uppercase tracking-wider">
                <th className="p-4">Gambar</th>
                <th className="p-4">Nama Item</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Tipe</th>
                <th className="p-4">Stok</th>
                <th className="p-4">Harga</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    {p.image ? (
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-12 h-12 rounded-lg object-cover border border-border shadow-xs" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-border flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-text">{p.name}</div>
                    {p.description && <div className="text-xs text-secondary line-clamp-1">{p.description}</div>}
                  </td>
                  <td className="p-4 text-secondary font-medium">{p.category?.name || '-'}</td>
                  <td className="p-4">
                    {getTypeBadge(p.type)}
                  </td>
                  <td className="p-4 text-text font-medium">
                    {p.stock !== undefined ? p.stock : 0}
                  </td>
                  <td className="p-4 text-text font-bold">
                    Rp {p.price.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(p)} className="text-secondary hover:text-accent p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => requestDelete(p)}
                      className="p-1.5 text-secondary hover:text-danger hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-secondary">Belum ada item menu atau produk coffee shop.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary">
                {editingId ? 'Edit Menu / Produk' : 'Tambah Menu / Produk Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-danger">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">Nama Item</label>
                <input 
                  type="text" 
                  required
                  placeholder="Misal: Caffe Latte (Ice)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">URL Gambar Produk</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="url" 
                    placeholder="https://example.com/gambar-kopi.jpg"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  />
                  {image && (
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="w-10 h-10 rounded-md object-cover border border-border shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-secondary mt-1">Masukkan URL gambar produk dari internet atau cloud storage.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase block mb-1">Deskripsi Singkat</label>
                <textarea 
                  rows="2"
                  placeholder="Penjelasan varian, rasa, atau catatan bahan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary uppercase block mb-1">Tipe</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Barang">Barang / Merchandise</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary uppercase block mb-1">Harga (Rp)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="30000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-secondary uppercase block mb-1">Kategori</label>
                  <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="">-- Tanpa Kategori --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary uppercase block mb-1">Stok Awal</label>
                  <input 
                    type="number" 
                    placeholder="100"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  />
                </div>
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
        title="Hapus Menu / Produk"
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirmItem?.name}"? Item ini akan dihapus dari daftar menu.`}
        isLoading={isDeleting}
      />
    </div>
  );
}

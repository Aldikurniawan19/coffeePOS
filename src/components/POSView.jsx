import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Coffee, 
  Utensils, 
  Package, 
  Search, 
  User, 
  Trash2, 
  CreditCard, 
  Plus, 
  Minus, 
  Banknote, 
  QrCode, 
  X, 
  Printer, 
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  Armchair,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { printerService } from '../lib/printerService';
import PrinterModal from './PrinterModal';

export default function POSView({ onTransactionComplete }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [customerName, setCustomerName] = useState('Walk-in (Pelanggan)');
  const [orderType, setOrderType] = useState('Dine-in');
  const [tableNumber, setTableNumber] = useState('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Printer states
  const [printerStatus, setPrinterStatus] = useState(printerService.getStatus());
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isPrintingThermal, setIsPrintingThermal] = useState(false);
  const [shopInfo, setShopInfo] = useState({ shopName: 'KOPI POS', address: '' });

  useEffect(() => {
    fetchData();
    fetchShopInfo();
    const unsubPrinter = printerService.subscribe((s) => setPrinterStatus(s));
    return () => unsubPrinter();
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

  const fetchData = async () => {
    try {
      const [resProd, resCat, resBarb] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/barbers').then(r => r.json())
      ]);
      setProducts(Array.isArray(resProd) ? resProd : []);
      setCategories(Array.isArray(resCat) ? resCat : []);
      setBarbers(Array.isArray(resBarb) ? resBarb : []);
    } catch (e) {
      console.error("Failed to load POS data:", e);
    }
  };

  const filteredProducts = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Semua') return matchesSearch;
    if (selectedCategory === 'Minuman') return matchesSearch && item.type === 'Minuman';
    if (selectedCategory === 'Makanan') return matchesSearch && item.type === 'Makanan';
    if (selectedCategory === 'Barang') return matchesSearch && item.type === 'Barang';
    return matchesSearch && item.category?.name === selectedCategory;
  });

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(i => i.productId === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].qty += 1;
        return updated;
      } else {
        return [...prevCart, {
          productId: product.id,
          name: product.name,
          price: product.price,
          type: product.type,
          image: product.image,
          qty: 1,
          notes: '',
        }];
      }
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.productId === productId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const updateCartNotes = (productId, notes) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.productId === productId) {
          return { ...item, notes };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal;

  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashAmount(total.toLocaleString('id-ID'));
    setIsPaymentModalOpen(true);
  };

  const handleFinishPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          paymentMethod,
          staffId: selectedBarber ? selectedBarber.id : null,
          barberId: selectedBarber ? selectedBarber.id : null,
          customerName,
          orderType,
          tableNumber: orderType === 'Dine-in' ? tableNumber : null,
        }),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (data.success) {
        setIsPaymentModalOpen(false);

        const rawCashNum = Number(String(cashAmount).replace(/\D/g, '')) || 0;
        const fullReceipt = {
          ...data.transaction,
          barberName: data.transaction.staffName || data.transaction.barberName,
          cashAmount: paymentMethod === 'Tunai' ? rawCashNum : null,
        };

        setReceiptData(fullReceipt);
        setIsReceiptModalOpen(true);
        setCart([]);
        if (onTransactionComplete) onTransactionComplete();
        fetchData();

        // AUTO PRINT TRIGGER (Web Bluetooth / WebUSB)
        const currentPrinter = printerService.getStatus();
        if (currentPrinter.autoPrintEnabled && currentPrinter.isConnected) {
          toast.loading("Mencetak struk thermal...", { id: 'autoprint' });
          printerService.printReceipt(fullReceipt, shopInfo)
            .then(() => {
              toast.success("Struk thermal berhasil dicetak!", { id: 'autoprint' });
            })
            .catch((err) => {
              toast.error("Gagal cetak otomatis: " + (err.message || "Error"), { id: 'autoprint' });
            });
        }
      } else {
        toast.error("Gagal memproses pembayaran: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      setIsProcessing(false);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleManualPrintThermal = async (txData) => {
    const curStatus = printerService.getStatus();
    if (!curStatus.isConnected) {
      toast.error("Printer belum terhubung. Sambungkan printer terlebih dahulu.");
      setIsPrinterModalOpen(true);
      return;
    }

    setIsPrintingThermal(true);
    try {
      await printerService.printReceipt(txData || receiptData, shopInfo);
      toast.success("Struk thermal berhasil dicetak!");
    } catch (err) {
      toast.error("Gagal mencetak struk: " + (err.message || "Error"));
    } finally {
      setIsPrintingThermal(false);
    }
  };

  const rawCashNum = Number(String(cashAmount).replace(/\D/g, '')) || 0;
  const changeDue = Math.max(0, rawCashNum - total);

  const handleCashInputChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setCashAmount('');
    } else {
      setCashAmount(Number(rawVal).toLocaleString('id-ID'));
    }
  };

  const renderProductIcon = (item) => {
    if (item.type === 'Minuman') return <Coffee className="w-8 h-8 text-blue-300 transition-transform group-hover:scale-110" />;
    if (item.type === 'Makanan') return <Utensils className="w-8 h-8 text-indigo-300 transition-transform group-hover:scale-110" />;
    return <Package className="w-8 h-8 text-sky-300 transition-transform group-hover:scale-110" />;
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full h-full overflow-hidden">
      {/* Left Catalog Section */}
      <div className="flex-[6.5] flex flex-col h-full bg-background border-r border-border min-w-0">
        {/* Search & Filter Header */}
        <div className="p-4 bg-card border-b border-border shrink-0 flex flex-col gap-3">
          {/* Category Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button 
              onClick={() => setSelectedCategory('Semua')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'Semua' ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white border border-border text-secondary hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              Semua
            </button>
            <button 
              onClick={() => setSelectedCategory('Minuman')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'Minuman' ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white border border-border text-secondary hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              Minuman
            </button>
            <button 
              onClick={() => setSelectedCategory('Makanan')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'Makanan' ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white border border-border text-secondary hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              Makanan / Pastry
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.name ? 'bg-blue-600 text-white shadow-sm font-semibold' : 'bg-white border border-border text-secondary hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Cari kopi, espresso, croissant, atau produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="relative h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200/80 bg-slate-900 flex flex-col justify-between"
              >
                {/* Full Background Image */}
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}

                {/* Fallback Display if no image */}
                <div 
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center"
                  style={{ display: product.image ? 'none' : 'flex' }}
                >
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-2 text-white shadow-inner">
                    {renderProductIcon(product)}
                  </div>
                </div>

                {/* Bottom Half Transparent Dark Gradient Overlay (Agak Solid di Bawah, Pudar ke Atas, Batas di Tengah Card) */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pointer-events-none transition-opacity duration-300 group-hover:opacity-100" />

                {/* Top Right Liquid Glass Add Button */}
                <div className="relative z-10 p-3 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 text-white shadow-[0_8px_25px_rgba(0,0,0,0.3)] hover:bg-blue-600 hover:border-blue-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center relative overflow-hidden group/btn"
                    title="Tambah ke Keranjang"
                  >
                    {/* Liquid Glass Glossy Highlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/10 to-transparent rounded-full pointer-events-none group-hover/btn:opacity-40 transition-opacity" />
                    <Plus className="w-5 h-5 text-white shrink-0 relative z-10 drop-shadow-sm" strokeWidth={2.8} />
                  </button>
                </div>

                {/* Bottom Overlay Content Area */}
                <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-end">
                  {/* Category Tag with dashes "- CATEGORY -" */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300 uppercase tracking-widest mb-1 drop-shadow-sm">
                    <span className="w-2.5 h-[2px] bg-blue-400 rounded-full inline-block"></span>
                    <span>{product.category?.name || product.type || 'MENU'}</span>
                    <span className="w-2.5 h-[2px] bg-blue-400 rounded-full inline-block"></span>
                  </div>

                  {/* Main Title (Prominent Bold White Text) */}
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug drop-shadow-md line-clamp-2 mb-1.5 group-hover:text-blue-200 transition-colors">
                    {product.name}
                  </h3>

                  {/* Price Tag */}
                  <div className="pt-2 border-t border-white/20">
                    <span className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-sm">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-secondary bg-slate-50/50 rounded-2xl border border-dashed border-border">
                Tidak ada menu atau produk ditemukan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Checkout System */}
      <div className="flex-[3.5] bg-card flex flex-col h-full shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 lg:w-[420px]">
        {/* Cart Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-base font-bold text-primary flex items-center gap-2">
            <Coffee className="w-5 h-5 text-accent" /> Pesanan Pesanan
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Printer Status Badge Button */}
            <button
              onClick={() => setIsPrinterModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                printerStatus.isConnected 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                  : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
              title={printerStatus.isConnected ? `Printer Connected (${printerStatus.deviceName})` : 'Kelola Printer Thermal'}
            >
              <span className={`w-2 h-2 rounded-full ${printerStatus.isConnected ? 'bg-blue-500 animate-pulse' : 'bg-blue-200'}`} />
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {printerStatus.isConnected ? printerStatus.deviceName : 'Kelola Printer'}
              </span>
            </button>

            <button 
              onClick={clearCart} 
              className="p-1.5 text-secondary hover:text-danger rounded-md hover:bg-red-50 transition-colors"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-4 border-b border-border shrink-0 space-y-3 bg-slate-50/50">
          {/* Order Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrderType('Dine-in')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                orderType === 'Dine-in' ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-white text-secondary border-border hover:bg-slate-50'
              }`}
            >
              <Armchair className="w-3.5 h-3.5" /> Dine-in (Makan di Sini)
            </button>
            <button
              type="button"
              onClick={() => setOrderType('Takeaway')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                orderType === 'Takeaway' ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-white text-secondary border-border hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Takeaway (Bawa Pulang)
            </button>
          </div>

          {/* Table Number & Customer Name Inputs (No Staff Selector) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-secondary uppercase mb-1 block">Nomor Meja</label>
              <input 
                type="text" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Misal: Meja 04"
                disabled={orderType === 'Takeaway'}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-text focus:outline-none focus:border-accent disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-secondary uppercase mb-1 block">Nama Pemesan</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Pelanggan (Opsional)"
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Coffee className="w-12 h-12 text-blue-600 mb-3" />
              <p className="text-sm font-medium text-text">Belum ada menu dipilih</p>
              <p className="text-xs text-secondary">Pilih menu kopi atau makanan di sebelah kiri</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="bg-white p-3 rounded-xl border border-border shadow-sm space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2 items-center flex-1">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-9 h-9 rounded-md object-cover border border-border shrink-0" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-text leading-tight">{item.name}</h4>
                      <span className="text-[10px] font-medium text-secondary">Rp {item.price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm font-bold text-text mb-1">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </div>
                    <div className="flex items-center border border-border rounded-lg bg-slate-50 overflow-hidden">
                      <button 
                        onClick={() => updateCartQty(item.productId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-secondary hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-text">{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item.productId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-secondary hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes Field */}
                <input 
                  type="text"
                  placeholder="Catatan pesanan (misal: Less Ice, Extra Shot...)"
                  value={item.notes || ''}
                  onChange={(e) => updateCartNotes(item.productId, e.target.value)}
                  className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-accent"
                />
              </div>
            ))
          )}
        </div>

        {/* Summary & Pay Button */}
        <div className="p-5 bg-white border-t border-border shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Subtotal</span>
              <span className="text-text font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Tipe Pesanan</span>
              <span className="text-blue-700 font-semibold">{orderType} {tableNumber ? `(${tableNumber})` : ''}</span>
            </div>
          </div>
          <div className="flex justify-between items-end mb-5 border-t border-border pt-3">
            <span className="text-base font-bold text-text">Total Tagihan</span>
            <span className="text-2xl font-bold text-blue-600">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          
          <button 
            onClick={handleOpenPayment}
            disabled={cart.length === 0}
            className={`w-full py-3.5 text-white text-[15px] font-semibold rounded-xl transition-all active:scale-[0.98] shadow-card flex justify-center items-center gap-2 ${
              cart.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-5 h-5" /> Bayar Sekarang
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border bg-slate-50/50">
              <h3 className="text-lg font-bold text-blue-600">Proses Pembayaran Kopi</h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-secondary hover:text-danger p-1 bg-white rounded-md border border-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Total Tagihan</p>
                <h2 className="text-[36px] font-bold text-text">Rp {total.toLocaleString('id-ID')}</h2>
                <p className="text-xs text-blue-700 font-semibold">{orderType} {tableNumber ? `• ${tableNumber}` : ''}</p>
              </div>

              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Pilih Metode</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button 
                  onClick={() => setPaymentMethod('Tunai')}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold flex flex-col items-center gap-2 transition-all border-2 ${
                    paymentMethod === 'Tunai' ? 'border-accent bg-blue-50 text-accent' : 'border-border text-secondary hover:border-accent'
                  }`}
                >
                  <Banknote className="w-6 h-6" /> Tunai
                </button>
                <button 
                  onClick={() => setPaymentMethod('Debit/EDC')}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold flex flex-col items-center gap-2 transition-all border-2 ${
                    paymentMethod === 'Debit/EDC' ? 'border-accent bg-blue-50 text-accent' : 'border-border text-secondary hover:border-accent'
                  }`}
                >
                  <CreditCard className="w-6 h-6" /> Debit/EDC
                </button>
                <button 
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`py-3 px-2 rounded-xl text-sm font-semibold flex flex-col items-center gap-2 transition-all border-2 ${
                    paymentMethod === 'QRIS' ? 'border-accent bg-blue-50 text-accent' : 'border-border text-secondary hover:border-accent'
                  }`}
                >
                  <QrCode className="w-6 h-6" /> QRIS
                </button>
              </div>

              {paymentMethod === 'Tunai' && (
                <div className="space-y-3 mb-4">
                  <label className="text-xs font-bold text-secondary uppercase block">Uang Diterima (Rp)</label>
                  <input 
                    type="text" 
                    value={cashAmount}
                    onChange={handleCashInputChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-border rounded-xl font-bold text-lg text-text focus:outline-none focus:border-accent"
                  />
                </div>
              )}
              
              <div className="p-4 bg-slate-50 border border-border rounded-xl flex justify-between items-center">
                <span className="text-sm font-medium text-secondary">Kembalian</span>
                <span className="text-lg font-bold text-text">
                  Rp {paymentMethod === 'Tunai' ? changeDue.toLocaleString('id-ID') : '0'}
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-border flex gap-3 bg-slate-50/50">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 px-4 bg-white border border-border text-text font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleFinishPayment}
                disabled={isProcessing}
                className="flex-[2] py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-card flex justify-center items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" /> Cetak & Selesai
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt / Invoice Modal */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 text-center overflow-y-auto max-h-[90vh]">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <h3 className="text-lg font-bold text-blue-600 mb-1">Transaksi Berhasil!</h3>
            <p className="text-xs text-secondary mb-4">{receiptData.code}</p>

            <div id="printable-receipt" className="bg-slate-50 p-4 rounded-xl text-left text-xs font-mono border border-border space-y-2 mb-6">
              <p className="text-center font-bold text-sm text-text uppercase tracking-wide">
                {shopInfo.shopName || 'KOPI POS'}
              </p>
              {shopInfo.address && (
                <p className="text-[10px] text-secondary text-center leading-tight mb-2 whitespace-pre-line">
                  {shopInfo.address}
                </p>
              )}
              <p className="text-secondary text-center mb-3">============================</p>
              <p><span className="text-secondary">Tanggal:</span> {new Date(receiptData.createdAt).toLocaleString('id-ID')}</p>
              <p><span className="text-secondary">Staff/Barista:</span> {receiptData.staffName || receiptData.barberName || '-'}</p>
              <p><span className="text-secondary">Tipe Order:</span> {receiptData.orderType || 'Dine-in'} {receiptData.tableNumber ? `(${receiptData.tableNumber})` : ''}</p>
              <p><span className="text-secondary">Pelanggan:</span> {receiptData.customerName}</p>
              <p><span className="text-secondary">Metode:</span> {receiptData.paymentMethod}</p>
              <p className="text-secondary text-center my-2">----------------------------</p>
              {receiptData.items?.map((it, idx) => (
                <div key={idx} className="mb-1">
                  <div className="flex justify-between">
                    <span>{it.qty}x {it.name}</span>
                    <span>Rp {(it.price * it.qty).toLocaleString('id-ID')}</span>
                  </div>
                  {it.notes && (
                    <div className="text-[10px] text-secondary italic pl-3">* {it.notes}</div>
                  )}
                </div>
              ))}
              <p className="text-secondary text-center my-2">============================</p>
              <div className="flex justify-between font-bold text-sm pt-1">
                <span>TOTAL:</span>
                <span>Rp {(receiptData.totalAmount || 0).toLocaleString('id-ID')}</span>
              </div>
              
              {receiptData.paymentMethod === 'Tunai' && (
                <div className="text-[11px] pt-1 space-y-0.5 border-t border-dashed border-slate-300">
                  <div className="flex justify-between">
                    <span>Bayar Tunai:</span>
                    <span>Rp {Number(receiptData.cashAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembali:</span>
                    <span>Rp {Math.max(0, Number(receiptData.cashAmount || 0) - Number(receiptData.totalAmount || 0)).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => handleManualPrintThermal(receiptData)}
                disabled={isPrintingThermal}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-card disabled:opacity-60"
              >
                {isPrintingThermal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mencetak Struk Thermal...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" /> Cetak Struk Thermal (ESC/POS)
                  </>
                )}
              </button>

              <button 
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-100 border border-border text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex justify-center items-center gap-2 text-xs"
              >
                <Printer className="w-4 h-4 text-slate-500" /> Cetak via Printer Biasa / PDF (Standard)
              </button>

              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-full py-2 bg-white border border-border text-secondary font-medium rounded-xl hover:bg-slate-50 transition-colors text-xs"
              >
                Tutup & Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printer Configuration Modal */}
      <PrinterModal 
        isOpen={isPrinterModalOpen} 
        onClose={() => setIsPrinterModalOpen(false)} 
      />
    </div>
  );
}

/**
 * Utility for generating ESC/POS binary commands for 58mm / 80mm thermal receipt printers.
 */

// ESC/POS Command Constants
const ESC = 0x1b;
const GS = 0x1d;

export const ESC_POS = {
  INIT: [ESC, 0x40],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  TEXT_NORMAL: [GS, 0x21, 0x00],
  TEXT_DOUBLE_HEIGHT: [GS, 0x21, 0x01],
  TEXT_DOUBLE_WIDTH: [GS, 0x21, 0x10],
  TEXT_DOUBLE_SIZE: [GS, 0x21, 0x11],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  LINE_FEED: [0x0a],
  FEED_LINES: (n = 3) => [ESC, 0x64, n],
  CUT_PAPER: [GS, 0x56, 0x41, 0x00],
  OPEN_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xfa],
};

class EscPosEncoder {
  constructor() {
    this.buffer = [];
    this.encoder = new TextEncoder();
  }

  // Add raw byte array
  addBytes(bytes) {
    this.buffer.push(...bytes);
    return this;
  }

  // Add text string
  addText(text) {
    const encoded = this.encoder.encode(text);
    this.buffer.push(...Array.from(encoded));
    return this;
  }

  // Add text line with automatic line feed
  addLine(text = '') {
    this.addText(text);
    this.buffer.push(0x0a);
    return this;
  }

  // Set text alignment
  align(mode) {
    if (mode === 'center') this.addBytes(ESC_POS.ALIGN_CENTER);
    else if (mode === 'right') this.addBytes(ESC_POS.ALIGN_RIGHT);
    else this.addBytes(ESC_POS.ALIGN_LEFT);
    return this;
  }

  // Set text styling
  style({ bold = false, size = 'normal' } = {}) {
    if (bold) this.addBytes(ESC_POS.BOLD_ON);
    else this.addBytes(ESC_POS.BOLD_OFF);

    if (size === 'double') this.addBytes(ESC_POS.TEXT_DOUBLE_SIZE);
    else if (size === 'double-height') this.addBytes(ESC_POS.TEXT_DOUBLE_HEIGHT);
    else if (size === 'double-width') this.addBytes(ESC_POS.TEXT_DOUBLE_WIDTH);
    else this.addBytes(ESC_POS.TEXT_NORMAL);

    return this;
  }

  // Add horizontal divider line
  addDivider(width = 32, char = '-') {
    this.addLine(char.repeat(width));
    return this;
  }

  // Add two column row (Left aligned text, Right aligned text)
  addTwoColumns(leftText, rightText, width = 32) {
    const spaceCount = width - leftText.length - rightText.length;
    if (spaceCount > 0) {
      this.addLine(leftText + ' '.repeat(spaceCount) + rightText);
    } else {
      // If left text is too long, print left text then right text right-aligned
      const truncatedLeft = leftText.substring(0, width - rightText.length - 1);
      const remainingSpaces = width - truncatedLeft.length - rightText.length;
      this.addLine(truncatedLeft + ' '.repeat(Math.max(1, remainingSpaces)) + rightText);
    }
    return this;
  }

  // Initialize printer
  init() {
    this.addBytes(ESC_POS.INIT);
    return this;
  }

  // Feed lines and cut paper
  cut() {
    this.addBytes(ESC_POS.FEED_LINES(4));
    this.addBytes(ESC_POS.CUT_PAPER);
    return this;
  }

  // Open cash drawer
  openDrawer() {
    this.addBytes(ESC_POS.OPEN_DRAWER);
    return this;
  }

  // Build and return final Uint8Array
  encode() {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Format receipt data into ESC/POS binary Uint8Array
 * @param {Object} receipt - Transaction details
 * @param {Object} shopInfo - Shop info (shopName, address)
 * @param {string} paperWidth - '58mm' (32 chars) or '80mm' (48 chars)
 */
export function generateReceiptEscPos(receipt, shopInfo = {}, paperWidth = '58mm') {
  const width = paperWidth === '80mm' ? 48 : 32;
  const encoder = new EscPosEncoder();

  const shopName = shopInfo.shopName || 'GENTLEMAN BARBER';
  const address = shopInfo.address || 'Jl. Barberpos No. 1';

  encoder.init();

  // Header: Shop Name & Address
  encoder.align('center');
  encoder.style({ bold: true, size: 'double-height' });
  encoder.addLine(shopName);
  encoder.style({ bold: false, size: 'normal' });
  if (address) {
    // Wrap address line if needed
    const lines = address.match(new RegExp('.{1,' + width + '}', 'g')) || [address];
    lines.forEach(line => encoder.addLine(line.trim()));
  }
  encoder.addDivider(width, '=');

  // Transaction Meta
  encoder.align('left');
  encoder.addTwoColumns('No. Struk:', receipt.code || '-', width);
  
  const dateStr = receipt.createdAt ? new Date(receipt.createdAt).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
  encoder.addTwoColumns('Tanggal:', dateStr, width);
  encoder.addTwoColumns('Kasir/Barber:', receipt.barberName || '-', width);
  encoder.addTwoColumns('Pelanggan:', receipt.customerName || 'Walk-in', width);
  encoder.addTwoColumns('Metode:', receipt.paymentMethod || 'Tunai', width);

  encoder.addDivider(width, '-');

  // Purchased Items
  if (Array.isArray(receipt.items)) {
    receipt.items.forEach(item => {
      const qtyPriceText = `${item.qty}x ${item.price ? 'Rp ' + item.price.toLocaleString('id-ID') : ''}`;
      const totalItemPrice = `Rp ${(item.price * item.qty).toLocaleString('id-ID')}`;
      
      // Item Name
      encoder.addLine(item.name);
      // Item Quantity & Total Price right aligned
      encoder.addTwoColumns(` ${qtyPriceText}`, totalItemPrice, width);
    });
  }

  encoder.addDivider(width, '=');

  // Total Amount
  encoder.style({ bold: true });
  encoder.addTwoColumns('TOTAL:', `Rp ${(receipt.totalAmount || 0).toLocaleString('id-ID')}`, width);
  encoder.style({ bold: false });

  // Cash / Change info if available
  if (receipt.cashAmount) {
    encoder.addTwoColumns('Tunai:', `Rp ${Number(receipt.cashAmount).toLocaleString('id-ID')}`, width);
    const change = Math.max(0, Number(receipt.cashAmount) - (receipt.totalAmount || 0));
    encoder.addTwoColumns('Kembali:', `Rp ${change.toLocaleString('id-ID')}`, width);
  }

  encoder.addDivider(width, '-');

  // Footer
  encoder.align('center');
  encoder.addLine('Terima kasih atas kunjungan Anda!');
  encoder.addLine('Sampai Jumpa Kembali');
  encoder.addLine('');

  // End of receipt
  encoder.cut();

  return encoder.encode();
}

/**
 * Generate test print receipt buffer
 */
export function generateTestReceiptEscPos(shopInfo = {}, paperWidth = '58mm') {
  const width = paperWidth === '80mm' ? 48 : 32;
  const encoder = new EscPosEncoder();
  const shopName = shopInfo.shopName || 'GENTLEMAN BARBER';

  encoder.init();
  encoder.align('center');
  encoder.style({ bold: true, size: 'double-height' });
  encoder.addLine(shopName);
  encoder.style({ bold: false, size: 'normal' });
  encoder.addLine('PRINTER THERMAL TEST');
  encoder.addDivider(width, '=');
  encoder.align('left');
  encoder.addLine('Status: KONEKSI BERHASIL!');
  encoder.addLine(`Ukuran Kertas: ${paperWidth}`);
  encoder.addLine(`Waktu Uji: ${new Date().toLocaleString('id-ID')}`);
  encoder.addDivider(width, '-');
  encoder.align('center');
  encoder.addLine('Printer Siap Digunakan');
  encoder.addLine('Pencetakan Struk Barberpos OK!');
  encoder.addLine('');
  encoder.cut();

  return encoder.encode();
}

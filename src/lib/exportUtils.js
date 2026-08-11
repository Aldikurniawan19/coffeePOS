/**
 * Utility functions for exporting reports to Excel and PDF without external npm dependencies.
 */

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
};

/**
 * Export Reports to Excel file (.xls XML Spreadsheet 2003 format)
 * Opens in MS Excel, Google Sheets, and LibreOffice with full formatting and multiple sheets.
 */
export function exportToExcel({
  transactions = [],
  staffSummary = [],
  totalRevenue = 0,
  totalCommission = 0,
  dateLabel = 'Semua Tanggal',
  shopName = 'Coffee POS'
}) {
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="HeaderSales">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:Bold="1"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&#34;Rp&#34;\ #,##0"/>
  </Style>
  <Style ss:ID="BoldCurrency">
   <Font ss:Bold="1"/>
   <NumberFormat ss:Format="&#34;Rp&#34;\ #,##0"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Riwayat Penjualan">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">LAPORAN PENJUALAN - ${escapeXml(shopName)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Periode: ${escapeXml(dateLabel)}</Data></Cell></Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">Kode TRX</Data></Cell>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">Waktu</Data></Cell>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">Pelanggan</Data></Cell>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">Staff / Barista</Data></Cell>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">Metode Pembayaran</Data></Cell>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">Total Transaksi (Rp)</Data></Cell>
    <Cell ss:StyleID="HeaderSales"><Data ss:Type="String">Komisi Staff (Rp)</Data></Cell>
   </Row>`;

  transactions.forEach((tx, idx) => {
    xml += `
   <Row>
    <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(tx.code)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(formatDate(tx.createdAt))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(tx.customerName || 'Walk-in')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(tx.staffName || tx.barberName || '-')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(tx.paymentMethod || 'Tunai')}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${tx.totalAmount || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${tx.staffComm || tx.barberComm || 0}</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">TOTAL</Data></Cell>
    <Cell/><Cell/><Cell/><Cell/>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalRevenue}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalCommission}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Bagi Hasil Staff">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">BAGI HASIL STAFF / BARISTA - ${escapeXml(shopName)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Periode: ${escapeXml(dateLabel)}</Data></Cell></Row>
   <Row></Row>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Staff</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kode</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Skema Jasa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Skema Produk</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Omset (Rp)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Hak Komisi Staff (Rp)</Data></Cell>
   </Row>`;

  staffSummary.forEach((b, idx) => {
    xml += `
   <Row>
    <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(b.code)}</Data></Cell>
    <Cell><Data ss:Type="String">${b.commissionCut}%</Data></Cell>
    <Cell><Data ss:Type="String">${b.commissionProduct}%</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${b.totalSales || 0}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${b.totalComm || 0}</Data></Cell>
   </Row>`;
  });

  xml += `
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">TOTAL</Data></Cell>
    <Cell/><Cell/><Cell/><Cell/>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${staffSummary.reduce((a, c) => a + (c.totalSales || 0), 0)}</Data></Cell>
    <Cell ss:StyleID="BoldCurrency"><Data ss:Type="Number">${totalCommission}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileTag = dateLabel.replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Laporan_${shopName.replace(/\s+/g, '_')}_${fileTag}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Reports to PDF Printable Report Window
 * Opens a pre-formatted print preview window for saving as PDF or direct printing.
 */
export function exportToPDF({
  transactions = [],
  staffSummary = [],
  totalRevenue = 0,
  totalCommission = 0,
  dateLabel = 'Semua Tanggal',
  shopInfo = {}
}) {
  const shopName = shopInfo.shopName || 'Coffee POS';
  const address = shopInfo.address || 'Jl. Kopi No. 1';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Laporan Keuangan ${escapeXml(shopName)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; }
    .header { background-color: #1e293b; color: white; padding: 18px 24px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 11px; color: #94a3b8; }
    .header .meta { text-align: right; font-size: 11px; color: #cbd5e1; }
    .stats { display: flex; gap: 15px; margin-bottom: 20px; }
    .stat-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; }
    .stat-card .label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .stat-card .value { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px; }
    .stat-card .value.commission { color: #dc2626; }
    .section-title { font-size: 13px; font-weight: bold; color: #1e293b; margin: 20px 0 10px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    th { background-color: #1e293b; color: white; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .total-row { font-weight: bold; background-color: #f1f5f9 !important; }
    .text-right { text-align: right; }
    .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${escapeXml(shopName)}</h1>
      <p>${escapeXml(address)}</p>
    </div>
    <div class="meta">
      <strong style="font-size: 13px; color: white;">LAPORAN KEUANGAN</strong><br/>
      Periode: ${escapeXml(dateLabel)}<br/>
      Dicetak: ${new Date().toLocaleString('id-ID')}
    </div>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="label">Total Pendapatan</div>
      <div class="value">${formatCurrency(totalRevenue)}</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Komisi Staff</div>
      <div class="value commission">${formatCurrency(totalCommission)}</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Transaksi</div>
      <div class="value">${transactions.length} Transaksi</div>
    </div>
  </div>

  <div class="section-title">1. Ringkasan Bagi Hasil Staff</div>
  <table>
    <thead>
      <tr>
        <th>Nama Staff</th>
        <th>Kode</th>
        <th>Skema Komisi</th>
        <th class="text-right">Total Omset</th>
        <th class="text-right">Hak Komisi</th>
      </tr>
    </thead>
    <tbody>
      ${staffSummary.map(b => `
        <tr>
          <td><strong>${escapeXml(b.name)}</strong></td>
          <td>${escapeXml(b.code)}</td>
          <td>Jasa ${b.commissionCut}% | Produk ${b.commissionProduct}%</td>
          <td class="text-right">${formatCurrency(b.totalSales)}</td>
          <td class="text-right" style="color: #dc2626; font-weight: bold;">${formatCurrency(b.totalComm)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="3" class="text-right">TOTAL KOMISI</td>
        <td class="text-right">${formatCurrency(staffSummary.reduce((a, c) => a + (c.totalSales || 0), 0))}</td>
        <td class="text-right" style="color: #dc2626;">${formatCurrency(totalCommission)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Riwayat Transaksi Penjualan</div>
  <table>
    <thead>
      <tr>
        <th>Kode TRX</th>
        <th>Waktu</th>
        <th>Pelanggan</th>
        <th>Staff / Barista</th>
        <th>Metode</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.map(tx => `
        <tr>
          <td><code>${escapeXml(tx.code)}</code></td>
          <td>${formatDate(tx.createdAt)}</td>
          <td>${escapeXml(tx.customerName || 'Walk-in')}</td>
          <td>${escapeXml(tx.staffName || tx.barberName || '-')}</td>
          <td>${escapeXml(tx.paymentMethod || 'Tunai')}</td>
          <td class="text-right"><strong>${formatCurrency(tx.totalAmount)}</strong></td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="5" class="text-right">TOTAL PENDAPATAN</td>
        <td class="text-right" style="color: #2563eb;">${formatCurrency(totalRevenue)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    CoffeePOS System &bull; Laporan Keuangan & Bagi Hasil &bull; ${escapeXml(shopName)}
  </div>

</body>
</html>`;

  // Create invisible iframe for seamless PDF print without navigating away
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '100%';
  iframe.style.bottom = '100%';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow.document;
  frameDoc.open();
  frameDoc.write(htmlContent);
  frameDoc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 250);
}

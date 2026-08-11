import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { items, paymentMethod, staffId, barberId, customerName, orderType, tableNumber } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart items cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const selectedStaffId = staffId || barberId;

    // Find staff if selected
    let staff = null;
    if (selectedStaffId) {
      staff = await prisma.staff.findUnique({
        where: { id: Number(selectedStaffId) },
      });
    }

    // Calculate total & staff commission (if configured)
    let totalAmount = 0;
    let totalStaffComm = 0;

    const itemsToCreate = [];

    for (const item of items) {
      const price = Number(item.price);
      const qty = Number(item.qty || 1);
      const itemTotal = price * qty;
      totalAmount += itemTotal;

      if (staff) {
        if (item.type === 'Minuman' || item.type === 'Jasa') {
          totalStaffComm += (itemTotal * (staff.commissionCut || 0)) / 100;
        } else {
          totalStaffComm += (itemTotal * (staff.commissionProduct || 0)) / 100;
        }
      }

      itemsToCreate.push({
        productId: item.productId ? Number(item.productId) : null,
        name: item.name,
        price: price,
        qty: qty,
        type: item.type || 'Minuman',
        notes: item.notes || null,
      });

      // Update product stock if stock exists
      if (item.productId) {
        try {
          await prisma.product.update({
            where: { id: Number(item.productId) },
            data: { stock: { decrement: qty } },
          });
        } catch (e) {
          // Ignore stock update error if product deleted or unmanaged
        }
      }
    }

    const txCode = 'TRX-' + Date.now();

    const transaction = await prisma.transaction.create({
      data: {
        code: txCode,
        totalAmount,
        paymentMethod: paymentMethod || 'Tunai',
        customerName: customerName || 'Walk-in (Pelanggan)',
        orderType: orderType || 'Dine-in',
        tableNumber: tableNumber || null,
        staffId: staff ? staff.id : null,
        staffName: staff ? staff.name : null,
        staffComm: totalStaffComm,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: true,
        staff: true,
      },
    });

    return new Response(JSON.stringify({ success: true, transaction }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('POS Checkout Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

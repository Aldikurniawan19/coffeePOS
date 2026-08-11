import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    const txWhere: any = {};
    if (startDateParam || endDateParam) {
      txWhere.createdAt = {};
      if (startDateParam) {
        const sDate = new Date(startDateParam);
        sDate.setHours(0, 0, 0, 0);
        txWhere.createdAt.gte = sDate;
      }
      if (endDateParam) {
        const eDate = new Date(endDateParam);
        eDate.setHours(23, 59, 59, 999);
        txWhere.createdAt.lte = eDate;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: txWhere,
      include: {
        items: true,
        staff: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const staffList = await prisma.staff.findMany({
      include: {
        transactions: {
          where: txWhere,
        },
      },
    });

    const setting = await prisma.setting.findFirst();
    const shopInfo = setting || {
      shopName: 'Kopi Kenangan POS',
      address: 'Jl. Coffee Boulevard No. 88, Jakarta',
    };

    // Summary calculations
    let totalRevenue = 0;
    let itemsSold = 0;
    let drinksSold = 0;
    let foodSold = 0;

    transactions.forEach((tx) => {
      totalRevenue += tx.totalAmount;

      tx.items.forEach((item) => {
        itemsSold += item.qty;
        if (item.type === 'Minuman' || item.type === 'Jasa') {
          drinksSold += item.qty;
        } else if (item.type === 'Makanan' || item.type === 'Barang') {
          foodSold += item.qty;
        }
      });
    });

    // 1. Weekly Chart Data (Last 7 Days)
    const daysName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const now = new Date();
    const weeklyChartData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime());
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = daysName[d.getDay()];

      const dayTxs = transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
        return txDate === dateStr;
      });

      const dayRevenue = dayTxs.reduce((sum, tx) => sum + tx.totalAmount, 0);

      weeklyChartData.push({
        label: `${dayLabel} (${d.getDate()}/${d.getMonth() + 1})`,
        shortLabel: dayLabel,
        revenue: dayRevenue,
        txCount: dayTxs.length,
      });
    }

    // 2. Monthly Chart Data (Last 4 Weeks of Current Month)
    const monthlyChartData = [];
    for (let w = 4; w >= 1; w--) {
      const weekLabel = `Minggu ${5 - w}`;
      const endDay = new Date(now.getTime());
      endDay.setDate(endDay.getDate() - (w - 1) * 7);
      const startDay = new Date(endDay.getTime());
      startDay.setDate(startDay.getDate() - 6);

      const weekTxs = transactions.filter((tx) => {
        const tDate = new Date(tx.createdAt);
        return tDate >= startDay && tDate <= endDay;
      });

      const weekRevenue = weekTxs.reduce((sum, tx) => sum + tx.totalAmount, 0);

      monthlyChartData.push({
        label: weekLabel,
        revenue: weekRevenue,
        txCount: weekTxs.length,
      });
    }

    const staffSummary = staffList.map((s) => {
      let sSales = 0;
      let sTxCount = s.transactions.length;

      s.transactions.forEach((tx) => {
        sSales += tx.totalAmount;
      });

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        role: s.role,
        totalSales: sSales,
        txCount: sTxCount,
      };
    });

    return new Response(
      JSON.stringify({
        totalRevenue,
        itemsSold,
        drinksSold,
        foodSold,
        transactions,
        staffSummary,
        barberSummary: staffSummary, // Alias for backward compatibility
        weeklyChartData,
        monthlyChartData,
        shopInfo,
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

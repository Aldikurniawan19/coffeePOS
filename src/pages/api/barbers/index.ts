import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    const staffList = await prisma.staff.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { id: 'asc' },
    });
    return new Response(JSON.stringify(staffList), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, code, role, commissionCut, commissionProduct, status } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), { status: 400 });
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        code: code || 'BAR-' + String(Math.floor(100 + Math.random() * 900)),
        role: role || 'Barista',
        commissionCut: Number(commissionCut || 0),
        commissionProduct: Number(commissionProduct || 0),
        status: status || 'Active',
      },
    });

    return new Response(JSON.stringify(staff), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

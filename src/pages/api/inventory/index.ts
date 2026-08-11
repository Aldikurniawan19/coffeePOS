import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    const products = await prisma.product.findMany({
      where: { type: 'Barang' },
      include: { category: true },
      orderBy: { stock: 'asc' },
    });
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, stock } = body;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: { stock: Number(stock) },
    });

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

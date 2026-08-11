import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { id: 'desc' },
    });
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, price, image, description, type, stock, categoryId, isAvailable } = body;

    if (!name || price === undefined) {
      return new Response(JSON.stringify({ error: 'Name and price are required' }), { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        image: image || null,
        description: description || null,
        type: type || 'Minuman',
        stock: Number(stock || 0),
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        categoryId: categoryId ? Number(categoryId) : null,
      },
      include: {
        category: true,
      },
    });

    return new Response(JSON.stringify(product), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { name, price, image, description, type, stock, categoryId, isAvailable } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        price: Number(price),
        image: image !== undefined ? image : undefined,
        description: description !== undefined ? description : undefined,
        type,
        stock: Number(stock || 0),
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
        categoryId: categoryId ? Number(categoryId) : null,
      },
      include: {
        category: true,
      },
    });

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    await prisma.product.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

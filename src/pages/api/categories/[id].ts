import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { name } = body;

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return new Response(JSON.stringify(category), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    await prisma.category.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

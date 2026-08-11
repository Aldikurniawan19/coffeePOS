import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { name, code, role, commissionCut, commissionProduct, status } = body;

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        name,
        code,
        role: role !== undefined ? role : undefined,
        commissionCut: Number(commissionCut || 0),
        commissionProduct: Number(commissionProduct || 0),
        status,
      },
    });

    return new Response(JSON.stringify(staff), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    await prisma.staff.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

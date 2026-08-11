import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async () => {
  try {
    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          shopName: 'Gentleman Barber',
          address: 'Jl. Sudirman No. 123, Jakarta',
        },
      });
    }
    return new Response(JSON.stringify(setting), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { shopName, address } = body;

    let setting = await prisma.setting.findFirst();
    if (setting) {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: { shopName, address },
      });
    } else {
      setting = await prisma.setting.create({
        data: { shopName, address },
      });
    }

    return new Response(JSON.stringify(setting), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

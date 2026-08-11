import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// PUT update user by id
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'ID tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { username, name, password } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if username is taken by another user
    if (username && username !== existingUser.username) {
      const taken = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
      });
      if (taken) {
        return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Build update data
    const updateData: any = {};
    if (username) updateData.username = username.toLowerCase().trim();
    if (name) updateData.name = name.trim();
    if (password && password.length > 0) {
      updateData.password = hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

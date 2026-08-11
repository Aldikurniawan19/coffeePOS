import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username dan password wajib diisi' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Username atau password salah' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const hashedInput = hashPassword(password);
    if (hashedInput !== user.password) {
      return new Response(
        JSON.stringify({ error: 'Username atau password salah' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create session payload
    const sessionData = JSON.stringify({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const sessionToken = Buffer.from(sessionData).toString('base64');

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        },
      }
    );
  } catch (err: any) {
    console.error('Login Error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

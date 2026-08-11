import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding Coffee POS database...');

  // Reset existing data
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  await prisma.user.create({
    data: {
      username: 'owner',
      password: hashPassword('owner123'),
      name: 'Owner Coffee Shop',
      role: 'owner',
    },
  });

  await prisma.user.create({
    data: {
      username: 'kasir',
      password: hashPassword('kasir123'),
      name: 'Kasir Utama',
      role: 'kasir',
    },
  });

  await prisma.user.create({
    data: {
      username: 'barista',
      password: hashPassword('barista123'),
      name: 'Barista Team',
      role: 'barista',
    },
  });

  // Create Settings
  await prisma.setting.create({
    data: {
      shopName: 'Kopi Kenangan POS',
      address: 'Jl. Coffee Boulevard No. 88, Jakarta Selatan',
      phone: '0812-3456-7890',
      footerNote: 'Terima kasih atas kunjungan Anda! Selamat menikmati kopi kami.',
    },
  });

  // Create Staff (Baristas)
  const alex = await prisma.staff.create({
    data: {
      name: 'Alex Barista',
      code: 'BAR-001',
      role: 'Head Barista',
      status: 'Active',
    },
  });

  const sarah = await prisma.staff.create({
    data: {
      name: 'Sarah Barista',
      code: 'BAR-002',
      role: 'Barista',
      status: 'Active',
    },
  });

  const budi = await prisma.staff.create({
    data: {
      name: 'Budi Staff',
      code: 'BAR-003',
      role: 'Kasir & Barista',
      status: 'Active',
    },
  });

  // Create Categories
  const catEspresso = await prisma.category.create({
    data: { name: 'Espresso Based' },
  });

  const catNonCoffee = await prisma.category.create({
    data: { name: 'Non-Coffee' },
  });

  const catManualBrew = await prisma.category.create({
    data: { name: 'Manual Brew' },
  });

  const catFood = await prisma.category.create({
    data: { name: 'Pastry & Food' },
  });

  const catBeans = await prisma.category.create({
    data: { name: 'Coffee Beans & Merchandise' },
  });

  // Create Products with Images
  const p1 = await prisma.product.create({
    data: {
      name: 'Espresso Single Shot',
      price: 20000,
      image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80',
      description: 'Single shot rich & bold espresso',
      type: 'Minuman',
      stock: 100,
      categoryId: catEspresso.id,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'Caffe Latte (Ice/Hot)',
      price: 32000,
      image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=400&q=80',
      description: 'Espresso dengan susu creamy yang pas',
      type: 'Minuman',
      stock: 100,
      categoryId: catEspresso.id,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Cappuccino (Hot)',
      price: 30000,
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80',
      description: 'Espresso dengan foam susu tebal khas Cappuccino',
      type: 'Minuman',
      stock: 100,
      categoryId: catEspresso.id,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Iced Americano',
      price: 25000,
      image: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&w=400&q=80',
      description: 'Espresso segar dipadu es dingin yang menyegarkan',
      type: 'Minuman',
      stock: 100,
      categoryId: catEspresso.id,
    },
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Iced Matcha Latte',
      price: 35000,
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
      description: 'Pure Uji Matcha asli dengan fresh milk',
      type: 'Minuman',
      stock: 80,
      categoryId: catNonCoffee.id,
    },
  });

  const p6 = await prisma.product.create({
    data: {
      name: 'Butter Croissant',
      price: 25000,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
      description: 'Freshly baked French butter croissant',
      type: 'Makanan',
      stock: 30,
      categoryId: catFood.id,
    },
  });

  const p7 = await prisma.product.create({
    data: {
      name: 'House Blend Beans 250g',
      price: 95000,
      image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=400&q=80',
      description: 'Biji kopi arabika blend spesial 250 gram',
      type: 'Barang',
      stock: 25,
      categoryId: catBeans.id,
    },
  });

  // Create sample transactions
  const now = new Date();
  
  await prisma.transaction.create({
    data: {
      code: 'TRX-' + Date.now() + '-1',
      totalAmount: 57000,
      paymentMethod: 'QRIS',
      customerName: 'Bpk. Rizky',
      orderType: 'Dine-in',
      tableNumber: 'Meja 04',
      staffId: alex.id,
      staffName: alex.name,
      createdAt: new Date(now.getTime() - 15 * 60000),
      items: {
        create: [
          {
            productId: p2.id,
            name: p2.name,
            price: 32000,
            qty: 1,
            type: 'Minuman',
            notes: 'Less Sugar, Ice Normal',
          },
          {
            productId: p6.id,
            name: p6.name,
            price: 25000,
            qty: 1,
            type: 'Makanan',
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      code: 'TRX-' + Date.now() + '-2',
      totalAmount: 25000,
      paymentMethod: 'Tunai',
      customerName: 'Walk-in',
      orderType: 'Takeaway',
      staffId: sarah.id,
      staffName: sarah.name,
      createdAt: new Date(now.getTime() - 30 * 60000),
      items: {
        create: [
          {
            productId: p4.id,
            name: p4.name,
            price: 25000,
            qty: 1,
            type: 'Minuman',
            notes: 'Extra Shot',
          },
        ],
      },
    },
  });

  console.log('Coffee POS Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

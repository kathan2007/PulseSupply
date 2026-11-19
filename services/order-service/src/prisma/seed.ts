 import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with initial data...');

  // 1. Seed Users (Indian Healthcare Operations Team)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('AdminPass2026!', salt);
  const staffPassword = await bcrypt.hash('StaffPass2026!', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pulsesupply.io' },
    update: {
      firstName: 'Aarav',
      lastName: 'Sharma',
    },
    create: {
      email: 'admin@pulsesupply.io',
      firstName: 'Aarav',
      lastName: 'Sharma',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@pulsesupply.io' },
    update: {
      firstName: 'Priya',
      lastName: 'Patel',
    },
    create: {
      email: 'staff@pulsesupply.io',
      firstName: 'Priya',
      lastName: 'Patel',
      passwordHash: staffPassword,
      role: 'STAFF',
    },
  });

  console.log(`✅ Seeded users: ${admin.firstName} ${admin.lastName} (ADMIN), ${staff.firstName} ${staff.lastName} (STAFF)`);

  // 2. Seed Products with Indian Rupee (INR ₹) Pricing
  const products = [
    {
      sku: 'MED-VENT-001',
      name: 'High-Flow Oxygen Ventilator',
      description: 'Precision turbine medical ventilator with continuous monitoring sensors.',
      category: 'Medical Devices',
      unitPrice: 850000.0,
      costPrice: 580000.0,
      stockQuantity: 18,
      minStockThreshold: 5,
    },
    {
      sku: 'PPE-N95-BX50',
      name: 'N95 Respirator Masks (Box of 50)',
      description: 'BIS/NIOSH-certified particulate filter facepieces for clinical environments.',
      category: 'PPE & Consumables',
      unitPrice: 1850.0,
      costPrice: 950.0,
      stockQuantity: 420,
      minStockThreshold: 50,
    },
    {
      sku: 'SURG-GLV-80',
      name: 'Sterile Nitrile Surgical Gloves (Size 8)',
      description: 'Powder-free textured surgical gloves with enhanced tactile grip.',
      category: 'Surgical Supplies',
      unitPrice: 850.0,
      costPrice: 420.0,
      stockQuantity: 14,
      minStockThreshold: 25, // Low stock trigger!
    },
    {
      sku: 'INF-PUMP-PRO',
      name: 'Smart Syringe Infusion Pump',
      description: 'Programmable dual-channel infusion pump with integrated drug library.',
      category: 'Medical Devices',
      unitPrice: 145000.0,
      costPrice: 95000.0,
      stockQuantity: 8,
      minStockThreshold: 4,
    },
    {
      sku: 'DIAG-MON-12',
      name: '12-Lead Multi-Parameter Vital Signs Monitor',
      description: 'Touchscreen clinical monitor with ECG, SpO2, NIBP, and temperature telemetry.',
      category: 'Diagnostics',
      unitPrice: 280000.0,
      costPrice: 190000.0,
      stockQuantity: 3,
      minStockThreshold: 5, // Low stock trigger!
    },
  ];

  const createdProducts = [];
  for (const item of products) {
    const p = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        stockQuantity: item.stockQuantity,
        minStockThreshold: item.minStockThreshold,
      },
      create: {
        sku: item.sku,
        name: item.name,
        description: item.description,
        category: item.category,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        stockQuantity: item.stockQuantity,
        minStockThreshold: item.minStockThreshold,
        status: 'ACTIVE',
      },
    });
    createdProducts.push(p);
  }

  console.log(`✅ Seeded ${createdProducts.length} products with INR pricing`);

  // 3. Seed Sample Indian Hospital Order
  const sampleOrder = await prisma.order.upsert({
    where: { orderNumber: 'ORD-20260401-INIT1' },
    update: {
      customerName: 'Apollo Hospitals (Bengaluru)',
      customerEmail: 'procurement@apollohospitals.com',
      totalAmount: 853700.0,
      notes: 'Urgent delivery to ICU Wing B - Main Campus',
    },
    create: {
      orderNumber: 'ORD-20260401-INIT1',
      customerName: 'Apollo Hospitals (Bengaluru)',
      customerEmail: 'procurement@apollohospitals.com',
      status: 'PROCESSING',
      totalAmount: 853700.0,
      notes: 'Urgent delivery to ICU Wing B - Main Campus',
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            quantity: 1,
            unitPrice: 850000.0,
            totalPrice: 850000.0,
          },
          {
            productId: createdProducts[1].id,
            quantity: 2,
            unitPrice: 1850.0,
            totalPrice: 3700.0,
          },
        ],
      },
    },
  });

  console.log(`✅ Seeded sample order: ${sampleOrder.orderNumber}`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

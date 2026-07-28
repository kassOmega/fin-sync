import { PrismaClient } from '@prisma/client';
import { SeedContext, daysAgo } from './utils';

interface CustomerData {
  key: string;
  companyKey: string;
  name: string;
  phone?: string;
  email?: string;
  isWalkIn?: boolean;
}

interface SupplierData {
  key: string;
  companyKey: string;
  name: string;
  phone?: string;
  email?: string;
}

interface SaleLineItem {
  itemKey: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SaleData {
  companyKey: string;
  customerKey: string;
  registeredByKey: string;
  totalAmount: number;
  discount: number;
  daysAgoDate: number;
  note?: string;
  items: SaleLineItem[];
}

interface PurchaseLineItem {
  itemKey: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface PurchaseData {
  companyKey: string;
  supplierKey: string;
  registeredByKey: string;
  totalAmount: number;
  note?: string;
  daysAgoDate: number;
  items: PurchaseLineItem[];
}

const CUSTOMERS: CustomerData[] = [
  {
    key: 'urban_alice',
    companyKey: 'urban_threads',
    name: 'Alice Johnson',
    phone: '+1-555-0201',
    email: 'alice@example.com',
  },
  {
    key: 'urban_michael',
    companyKey: 'urban_threads',
    name: 'Michael Chen',
    phone: '+1-555-0202',
    email: 'mchen@email.com',
  },
  {
    key: 'urban_sarah_m',
    companyKey: 'urban_threads',
    name: 'Sarah Mitchell',
    phone: '+1-555-0203',
    email: 'sarah.m@email.com',
  },
  {
    key: 'urban_james_l',
    companyKey: 'urban_threads',
    name: 'James Liu',
    phone: '+1-555-0204',
    email: 'jliu@email.com',
  },
  {
    key: 'urban_emily_r',
    companyKey: 'urban_threads',
    name: 'Emily Roberts',
    phone: '+1-555-0205',
    email: 'emily.r@email.com',
  },
  {
    key: 'urban_david_k',
    companyKey: 'urban_threads',
    name: 'David Kim',
    phone: '+1-555-0206',
    email: 'dkim@email.com',
  },
  {
    key: 'urban_lisa_w',
    companyKey: 'urban_threads',
    name: 'Lisa Wang',
    phone: '+1-555-0207',
    email: 'lwang@email.com',
  },
  {
    key: 'urban_robert_p',
    companyKey: 'urban_threads',
    name: 'Robert Park',
    phone: '+1-555-0208',
    email: 'rpark@email.com',
  },
  {
    key: 'urban_walkin',
    companyKey: 'urban_threads',
    name: 'Walk-in Customer',
    isWalkIn: true,
  },
  {
    key: 'buildmart_contractor_1',
    companyKey: 'home_depot_mini',
    name: 'ProBuild Contractors',
    phone: '+1-555-0301',
    email: 'orders@probuild.com',
  },
  {
    key: 'buildmart_diy_1',
    companyKey: 'home_depot_mini',
    name: 'John Homeowner',
    phone: '+1-555-0302',
    email: 'john.diy@email.com',
  },
  {
    key: 'buildmart_diy_2',
    companyKey: 'home_depot_mini',
    name: 'Mary Smith',
    phone: '+1-555-0303',
  },
  {
    key: 'buildmart_contractor_2',
    companyKey: 'home_depot_mini',
    name: 'FixItAll Services',
    phone: '+1-555-0304',
    email: 'purchasing@fixitall.com',
  },
  {
    key: 'buildmart_walkin',
    companyKey: 'home_depot_mini',
    name: 'Walk-in Customer',
    isWalkIn: true,
  },
];

const SUPPLIERS: SupplierData[] = [
  {
    key: 'urban_royal_textile',
    companyKey: 'urban_threads',
    name: 'Royal Textile Mills Ltd.',
    phone: '+1-555-0401',
    email: 'orders@royaltextile.com',
  },
  {
    key: 'urban_premium_fabrics',
    companyKey: 'urban_threads',
    name: 'Premium Fabrics Co.',
    phone: '+1-555-0402',
    email: 'sales@premiumfabrics.com',
  },
  {
    key: 'urban_leather_goods',
    companyKey: 'urban_threads',
    name: 'Genuine Leather Goods Inc.',
    phone: '+1-555-0403',
    email: 'wholesale@leathergoods.com',
  },
  {
    key: 'urban_footwear_suppliers',
    companyKey: 'urban_threads',
    name: 'StepRight Footwear Mfg.',
    phone: '+1-555-0404',
    email: 'b2b@stepright.com',
  },
  {
    key: 'urban_packaging_co',
    companyKey: 'urban_threads',
    name: 'EcoPack Solutions',
    phone: '+1-555-0405',
    email: 'orders@ecopack.com',
  },
  {
    key: 'buildmart_dewalt_dist',
    companyKey: 'home_depot_mini',
    name: 'DeWalt Authorized Distributor',
    phone: '+1-555-0501',
    email: 'wholesale@dewalt-dist.com',
  },
  {
    key: 'buildmart_makita_dist',
    companyKey: 'home_depot_mini',
    name: 'Makita Regional Warehouse',
    phone: '+1-555-0502',
    email: 'orders@makita-wh.com',
  },
  {
    key: 'buildmart_hardware_wh',
    companyKey: 'home_depot_mini',
    name: 'National Hardware Wholesale',
    phone: '+1-555-0503',
    email: 'sales@nationalhw.com',
  },
  {
    key: 'buildmart_paint_supplier',
    companyKey: 'home_depot_mini',
    name: 'ColorMaster Paints',
    phone: '+1-555-0504',
    email: 'trade@colormaster.com',
  },
];

const URBAN_SALES: SaleData[] = [
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_alice',
    registeredByKey: 'sales_emma',
    totalAmount: 204.97,
    discount: 10,
    daysAgoDate: 3,
    note: 'Regular customer - loyalty discount',
    items: [
      {
        itemKey: 'urban_tshirt_white',
        quantity: 3,
        unitPrice: 24.99,
        total: 74.97,
      },
      {
        itemKey: 'urban_jeans_blue',
        quantity: 2,
        unitPrice: 59.99,
        total: 119.98,
      },
      {
        itemKey: 'urban_belt_leather',
        quantity: 1,
        unitPrice: 39.99,
        total: 39.99,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_michael',
    registeredByKey: 'sales_emma',
    totalAmount: 389.97,
    discount: 0,
    daysAgoDate: 7,
    items: [
      {
        itemKey: 'urban_jacket_black',
        quantity: 3,
        unitPrice: 129.99,
        total: 389.97,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_walkin',
    registeredByKey: 'sales_nina',
    totalAmount: 74.97,
    discount: 0,
    daysAgoDate: 1,
    note: 'Walk-in customer',
    items: [
      {
        itemKey: 'urban_tshirt_black',
        quantity: 3,
        unitPrice: 24.99,
        total: 74.97,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_sarah_m',
    registeredByKey: 'sales_ryan',
    totalAmount: 339.96,
    discount: 20,
    daysAgoDate: 5,
    note: 'VIP customer discount',
    items: [
      {
        itemKey: 'urban_sweater_gray',
        quantity: 2,
        unitPrice: 79.99,
        total: 159.98,
      },
      {
        itemKey: 'urban_scarf_silk',
        quantity: 2,
        unitPrice: 49.99,
        total: 99.98,
      },
      { itemKey: 'urban_wallet', quantity: 1, unitPrice: 45.99, total: 45.99 },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_david_k',
    registeredByKey: 'sales_emma',
    totalAmount: 279.97,
    discount: 0,
    daysAgoDate: 10,
    items: [
      {
        itemKey: 'urban_jeans_black',
        quantity: 2,
        unitPrice: 59.99,
        total: 119.98,
      },
      {
        itemKey: 'urban_sneakers_white',
        quantity: 1,
        unitPrice: 89.99,
        total: 89.99,
      },
      {
        itemKey: 'urban_tshirt_white',
        quantity: 2,
        unitPrice: 24.99,
        total: 49.98,
      },
      {
        itemKey: 'urban_belt_leather',
        quantity: 1,
        unitPrice: 39.99,
        total: 39.99,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_emily_r',
    registeredByKey: 'sales_nina',
    totalAmount: 329.98,
    discount: 0,
    daysAgoDate: 14,
    items: [
      {
        itemKey: 'urban_dress_red',
        quantity: 2,
        unitPrice: 149.99,
        total: 299.98,
      },
      {
        itemKey: 'urban_scarf_silk',
        quantity: 1,
        unitPrice: 49.99,
        total: 49.99,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_james_l',
    registeredByKey: 'sales_ryan',
    totalAmount: 249.98,
    discount: 0,
    daysAgoDate: 21,
    items: [
      {
        itemKey: 'urban_boots_chelsea',
        quantity: 1,
        unitPrice: 159.99,
        total: 159.99,
      },
      { itemKey: 'urban_wallet', quantity: 2, unitPrice: 45.99, total: 91.98 },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_robert_p',
    registeredByKey: 'sales_emma',
    totalAmount: 419.95,
    discount: 15,
    daysAgoDate: 28,
    note: 'Bulk purchase discount',
    items: [
      {
        itemKey: 'urban_jacket_navy',
        quantity: 2,
        unitPrice: 129.99,
        total: 259.98,
      },
      {
        itemKey: 'urban_tshirt_white',
        quantity: 4,
        unitPrice: 24.99,
        total: 99.96,
      },
      {
        itemKey: 'urban_tshirt_black',
        quantity: 2,
        unitPrice: 24.99,
        total: 49.98,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_lisa_w',
    registeredByKey: 'sales_nina',
    totalAmount: 159.98,
    discount: 0,
    daysAgoDate: 35,
    items: [
      {
        itemKey: 'urban_sweater_gray',
        quantity: 2,
        unitPrice: 79.99,
        total: 159.98,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    customerKey: 'urban_walkin',
    registeredByKey: 'sales_ryan',
    totalAmount: 89.99,
    discount: 0,
    daysAgoDate: 2,
    items: [
      {
        itemKey: 'urban_sneakers_white',
        quantity: 1,
        unitPrice: 89.99,
        total: 89.99,
      },
    ],
  },
];

const BUILDMART_SALES: SaleData[] = [
  {
    companyKey: 'home_depot_mini',
    customerKey: 'buildmart_contractor_1',
    registeredByKey: 'sales_emma',
    totalAmount: 649.95,
    discount: 25,
    daysAgoDate: 2,
    note: 'Contractor discount applied',
    items: [
      {
        itemKey: 'buildmart_drill_cordless',
        quantity: 3,
        unitPrice: 129.99,
        total: 389.97,
      },
      {
        itemKey: 'buildmart_circular_saw',
        quantity: 1,
        unitPrice: 149.99,
        total: 149.99,
      },
      {
        itemKey: 'buildmart_angle_grinder',
        quantity: 1,
        unitPrice: 79.99,
        total: 79.99,
      },
    ],
  },
  {
    companyKey: 'home_depot_mini',
    customerKey: 'buildmart_diy_1',
    registeredByKey: 'sales_emma',
    totalAmount: 97.97,
    discount: 0,
    daysAgoDate: 5,
    items: [
      {
        itemKey: 'buildmart_hammer_claw',
        quantity: 1,
        unitPrice: 24.99,
        total: 24.99,
      },
      {
        itemKey: 'buildmart_screwdriver_set',
        quantity: 1,
        unitPrice: 34.99,
        total: 34.99,
      },
      {
        itemKey: 'buildmart_paint_roller',
        quantity: 1,
        unitPrice: 15.99,
        total: 15.99,
      },
      {
        itemKey: 'buildmart_paint_white_5l',
        quantity: 1,
        unitPrice: 32.99,
        total: 32.99,
      },
    ],
  },
  {
    companyKey: 'home_depot_mini',
    customerKey: 'buildmart_contractor_2',
    registeredByKey: 'sales_emma',
    totalAmount: 424.94,
    discount: 15,
    daysAgoDate: 8,
    note: 'Account customer',
    items: [
      {
        itemKey: 'buildmart_wrench_set',
        quantity: 4,
        unitPrice: 49.99,
        total: 199.96,
      },
      {
        itemKey: 'buildmart_nails_assorted',
        quantity: 10,
        unitPrice: 12.99,
        total: 129.9,
      },
      {
        itemKey: 'buildmart_screws_assorted',
        quantity: 5,
        unitPrice: 14.99,
        total: 74.95,
      },
    ],
  },
  {
    companyKey: 'home_depot_mini',
    customerKey: 'buildmart_walkin',
    registeredByKey: 'sales_emma',
    totalAmount: 179.98,
    discount: 0,
    daysAgoDate: 1,
    items: [
      {
        itemKey: 'buildmart_drill_cordless',
        quantity: 1,
        unitPrice: 129.99,
        total: 129.99,
      },
      {
        itemKey: 'buildmart_hammer_claw',
        quantity: 1,
        unitPrice: 24.99,
        total: 24.99,
      },
      {
        itemKey: 'buildmart_nails_assorted',
        quantity: 2,
        unitPrice: 12.99,
        total: 25.98,
      },
    ],
  },
];

const URBAN_PURCHASES: PurchaseData[] = [
  {
    companyKey: 'urban_threads',
    supplierKey: 'urban_royal_textile',
    registeredByKey: 'store_anna',
    totalAmount: 3750,
    daysAgoDate: 20,
    note: 'Monthly restock - clothing',
    items: [
      {
        itemKey: 'urban_tshirt_white',
        quantity: 100,
        unitCost: 12.5,
        total: 1250,
      },
      {
        itemKey: 'urban_tshirt_black',
        quantity: 100,
        unitCost: 12.5,
        total: 1250,
      },
      {
        itemKey: 'urban_jeans_blue',
        quantity: 50,
        unitCost: 28.0,
        total: 1400,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    supplierKey: 'urban_premium_fabrics',
    registeredByKey: 'store_anna',
    totalAmount: 650,
    daysAgoDate: 10,
    note: 'Premium jacket restock',
    items: [
      {
        itemKey: 'urban_jacket_black',
        quantity: 10,
        unitCost: 65.0,
        total: 650,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    supplierKey: 'urban_leather_goods',
    registeredByKey: 'store_anna',
    totalAmount: 900,
    daysAgoDate: 15,
    note: 'Accessories order',
    items: [
      {
        itemKey: 'urban_belt_leather',
        quantity: 20,
        unitCost: 15.0,
        total: 300,
      },
      { itemKey: 'urban_wallet', quantity: 15, unitCost: 20.0, total: 300 },
      { itemKey: 'urban_scarf_silk', quantity: 10, unitCost: 18.0, total: 180 },
    ],
  },
  {
    companyKey: 'urban_threads',
    supplierKey: 'urban_footwear_suppliers',
    registeredByKey: 'store_anna',
    totalAmount: 2340,
    daysAgoDate: 25,
    note: 'Footwear order',
    items: [
      {
        itemKey: 'urban_sneakers_white',
        quantity: 20,
        unitCost: 42.0,
        total: 840,
      },
      {
        itemKey: 'urban_boots_chelsea',
        quantity: 10,
        unitCost: 75.0,
        total: 750,
      },
      {
        itemKey: 'urban_jacket_navy',
        quantity: 10,
        unitCost: 65.0,
        total: 650,
      },
    ],
  },
  {
    companyKey: 'urban_threads',
    supplierKey: 'urban_packaging_co',
    registeredByKey: 'store_anna',
    totalAmount: 900,
    daysAgoDate: 30,
    note: 'Packaging supplies',
    items: [
      {
        itemKey: 'urban_bag_shopping',
        quantity: 30,
        unitCost: 12.0,
        total: 360,
      },
      { itemKey: 'urban_box_gift', quantity: 30, unitCost: 18.0, total: 540 },
    ],
  },
];

const BUILDMART_PURCHASES: PurchaseData[] = [
  {
    companyKey: 'home_depot_mini',
    supplierKey: 'buildmart_dewalt_dist',
    registeredByKey: 'store_bob',
    totalAmount: 5625,
    daysAgoDate: 15,
    note: 'Monthly power tools restock',
    items: [
      {
        itemKey: 'buildmart_drill_cordless',
        quantity: 25,
        unitCost: 75.0,
        total: 1875,
      },
      {
        itemKey: 'buildmart_circular_saw',
        quantity: 15,
        unitCost: 85.0,
        total: 1275,
      },
      {
        itemKey: 'buildmart_angle_grinder',
        quantity: 20,
        unitCost: 45.0,
        total: 900,
      },
    ],
  },
  {
    companyKey: 'home_depot_mini',
    supplierKey: 'buildmart_hardware_wh',
    registeredByKey: 'store_bob',
    totalAmount: 1560,
    daysAgoDate: 10,
    note: 'Hardware restock',
    items: [
      {
        itemKey: 'buildmart_nails_assorted',
        quantity: 80,
        unitCost: 6.0,
        total: 480,
      },
      {
        itemKey: 'buildmart_screws_assorted',
        quantity: 60,
        unitCost: 7.0,
        total: 420,
      },
      {
        itemKey: 'buildmart_hammer_claw',
        quantity: 20,
        unitCost: 12.0,
        total: 240,
      },
      {
        itemKey: 'buildmart_screwdriver_set',
        quantity: 15,
        unitCost: 16.0,
        total: 240,
      },
      {
        itemKey: 'buildmart_wrench_set',
        quantity: 10,
        unitCost: 24.0,
        total: 240,
      },
    ],
  },
  {
    companyKey: 'home_depot_mini',
    supplierKey: 'buildmart_paint_supplier',
    registeredByKey: 'store_bob',
    totalAmount: 2460,
    daysAgoDate: 20,
    note: 'Paint supplies order',
    items: [
      {
        itemKey: 'buildmart_paint_white_5l',
        quantity: 50,
        unitCost: 18.0,
        total: 900,
      },
      {
        itemKey: 'buildmart_paint_roller',
        quantity: 40,
        unitCost: 7.0,
        total: 280,
      },
    ],
  },
];

export async function seedRetail(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🛍️ Seeding Retail Data...');

  for (const cust of CUSTOMERS) {
    const created = await prisma.customer.create({
      data: {
        companyId: ctx.companies[cust.companyKey],
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
      },
    });
    ctx.customers[cust.key] = created.id;
  }

  for (const sup of SUPPLIERS) {
    const created = await prisma.supplier.create({
      data: {
        companyId: ctx.companies[sup.companyKey],
        name: sup.name,
        phone: sup.phone,
        email: sup.email,
      },
    });
    ctx.suppliers[sup.key] = created.id;
  }

  const allSales = [...URBAN_SALES, ...BUILDMART_SALES];
  for (const sale of allSales) {
    await prisma.sale.create({
      data: {
        companyId: ctx.companies[sale.companyKey],
        customerId: ctx.customers[sale.customerKey],
        registeredBy: ctx.users[sale.registeredByKey],
        totalAmount: sale.totalAmount,
        discount: sale.discount,
        note: sale.note,
        date: daysAgo(sale.daysAgoDate),
        items: {
          create: sale.items.map((item) => ({
            itemId: ctx.storeItems[item.itemKey],
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
    });
  }

  const allPurchases = [...URBAN_PURCHASES, ...BUILDMART_PURCHASES];
  for (const purchase of allPurchases) {
    await prisma.purchase.create({
      data: {
        companyId: ctx.companies[purchase.companyKey],
        supplierId: ctx.suppliers[purchase.supplierKey],
        registeredBy: ctx.users[purchase.registeredByKey],
        totalAmount: purchase.totalAmount,
        note: purchase.note,
        date: daysAgo(purchase.daysAgoDate),
        items: {
          create: purchase.items.map((item) => ({
            itemId: ctx.storeItems[item.itemKey],
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.total,
          })),
        },
      },
    });
  }

  console.log(
    `   ✅ Created ${CUSTOMERS.length} customers, ${SUPPLIERS.length} suppliers`,
  );
  console.log(
    `   ✅ Created ${allSales.length} sales, ${allPurchases.length} purchases`,
  );
}

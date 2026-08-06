import { PrismaClient, StoreTxType } from '@prisma/client';
import { SeedContext, daysAgo } from './utils';

interface StoreCategoryData {
  key: string;
  companyKey: string;
  name: string;
}

interface StoreItemData {
  key: string;
  companyKey: string;
  categoryKey: string;
  name: string;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
  sellingPrice?: number;
  costPrice?: number;
  isTool?: boolean;
}

interface StoreTransactionData {
  itemKey: string;
  companyKey: string;
  type: StoreTxType;
  quantity: number;
  status: string;
  daysAgoDate: number;
  issuedToUserKey?: string;
  note?: string;
}

interface StoreRequestData {
  itemKey: string;
  companyKey: string;
  userKey: string;
  quantity: number;
  status: string;
  note?: string;
}

const STORE_CATEGORIES: StoreCategoryData[] = [
  {
    key: 'buildco_cat_general',
    companyKey: 'buildco',
    name: 'General Supplies',
  },
  {
    key: 'buildco_cat_cement',
    companyKey: 'buildco',
    name: 'Cement & Concrete',
  },
  {
    key: 'buildco_cat_steel',
    companyKey: 'buildco',
    name: 'Steel & Reinforcement',
  },
  { key: 'buildco_cat_aggregates', companyKey: 'buildco', name: 'Aggregates' },
  {
    key: 'buildco_cat_tools',
    companyKey: 'buildco',
    name: 'Tools & Equipment',
  },
  {
    key: 'buildco_cat_safety',
    companyKey: 'buildco',
    name: 'Safety Equipment',
  },
  {
    key: 'buildco_cat_plumbing',
    companyKey: 'buildco',
    name: 'Plumbing Materials',
  },
  {
    key: 'buildco_cat_electrical',
    companyKey: 'buildco',
    name: 'Electrical Materials',
  },
  { key: 'buildco_cat_wood', companyKey: 'buildco', name: 'Wood & Lumber' },
  {
    key: 'buildco_cat_finishing',
    companyKey: 'buildco',
    name: 'Finishing Materials',
  },
  { key: 'horizon_cat_fuel', companyKey: 'horizon', name: 'Fuel & Lubricants' },
  {
    key: 'horizon_cat_packing',
    companyKey: 'horizon',
    name: 'Packing Materials',
  },
  {
    key: 'horizon_cat_maintenance',
    companyKey: 'horizon',
    name: 'Maintenance Supplies',
  },
  {
    key: 'horizon_cat_safety',
    companyKey: 'horizon',
    name: 'Safety Equipment',
  },
  { key: 'horizon_cat_office', companyKey: 'horizon', name: 'Office Supplies' },
  {
    key: 'green_cat_seeds',
    companyKey: 'greenvalley',
    name: 'Seeds & Seedlings',
  },
  {
    key: 'green_cat_fertilizer',
    companyKey: 'greenvalley',
    name: 'Fertilizers',
  },
  {
    key: 'green_cat_pesticide',
    companyKey: 'greenvalley',
    name: 'Pesticides & Chemicals',
  },
  { key: 'green_cat_tools', companyKey: 'greenvalley', name: 'Farm Tools' },
  {
    key: 'green_cat_irrigation',
    companyKey: 'greenvalley',
    name: 'Irrigation Supplies',
  },
  { key: 'green_cat_feed', companyKey: 'greenvalley', name: 'Animal Feed' },
  { key: 'urban_cat_clothing', companyKey: 'urban_threads', name: 'Clothing' },
  {
    key: 'urban_cat_accessories',
    companyKey: 'urban_threads',
    name: 'Accessories',
  },
  { key: 'urban_cat_footwear', companyKey: 'urban_threads', name: 'Footwear' },
  {
    key: 'urban_cat_packaging',
    companyKey: 'urban_threads',
    name: 'Packaging',
  },
  {
    key: 'buildmart_cat_tools',
    companyKey: 'home_depot_mini',
    name: 'Power Tools',
  },
  {
    key: 'buildmart_cat_handtools',
    companyKey: 'home_depot_mini',
    name: 'Hand Tools',
  },
  {
    key: 'buildmart_cat_hardware',
    companyKey: 'home_depot_mini',
    name: 'Hardware',
  },
  {
    key: 'buildmart_cat_paint',
    companyKey: 'home_depot_mini',
    name: 'Paint & Finishes',
  },
  {
    key: 'buildmart_cat_plumbing',
    companyKey: 'home_depot_mini',
    name: 'Plumbing',
  },
  {
    key: 'buildmart_cat_electrical',
    companyKey: 'home_depot_mini',
    name: 'Electrical',
  },
  {
    key: 'fresheats_cat_produce',
    companyKey: 'fresh_eats',
    name: 'Fresh Produce',
  },
  {
    key: 'fresheats_cat_meat',
    companyKey: 'fresh_eats',
    name: 'Meat & Seafood',
  },
  { key: 'fresheats_cat_dairy', companyKey: 'fresh_eats', name: 'Dairy' },
  { key: 'fresheats_cat_dry', companyKey: 'fresh_eats', name: 'Dry Goods' },
  {
    key: 'fresheats_cat_beverages',
    companyKey: 'fresh_eats',
    name: 'Beverages',
  },
  {
    key: 'fresheats_cat_cleaning',
    companyKey: 'fresh_eats',
    name: 'Cleaning Supplies',
  },
];

const STORE_ITEMS: StoreItemData[] = [
  {
    key: 'buildco_cement_50kg',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_cement',
    name: 'Portland Cement 50kg Bags',
    quantity: 250,
    lowStockThreshold: 50,
    unit: 'bags',
    costPrice: 8.5,
  },
  {
    key: 'buildco_cement_25kg',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_cement',
    name: 'Portland Cement 25kg Bags',
    quantity: 100,
    lowStockThreshold: 30,
    unit: 'bags',
    costPrice: 5.0,
  },
  {
    key: 'buildco_rebar_t12',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_steel',
    name: 'Steel Rebar T12 (12mm x 12m)',
    quantity: 18,
    lowStockThreshold: 30,
    unit: 'pcs',
    costPrice: 18.0,
  },
  {
    key: 'buildco_rebar_t16',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_steel',
    name: 'Steel Rebar T16 (16mm x 12m)',
    quantity: 45,
    lowStockThreshold: 20,
    unit: 'pcs',
    costPrice: 28.0,
  },
  {
    key: 'buildco_sand',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_aggregates',
    name: 'River Sand',
    quantity: 50,
    lowStockThreshold: 15,
    unit: 'm³',
    costPrice: 45.0,
  },
  {
    key: 'buildco_gravel',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_aggregates',
    name: 'Crushed Gravel 20mm',
    quantity: 35,
    lowStockThreshold: 10,
    unit: 'm³',
    costPrice: 55.0,
  },
  {
    key: 'buildco_jackhammer',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_tools',
    name: 'Bosch Industrial Jackhammer',
    quantity: 4,
    lowStockThreshold: 1,
    unit: 'pcs',
    costPrice: 850.0,
    isTool: true,
  },
  {
    key: 'buildco_helmet',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_safety',
    name: 'Safety Helmet',
    quantity: 40,
    lowStockThreshold: 15,
    unit: 'pcs',
    costPrice: 15.0,
  },
  {
    key: 'buildco_vest',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_safety',
    name: 'High-Vis Safety Vest',
    quantity: 35,
    lowStockThreshold: 10,
    unit: 'pcs',
    costPrice: 12.0,
  },
  {
    key: 'buildco_boots',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_safety',
    name: 'Steel-Toe Safety Boots',
    quantity: 20,
    lowStockThreshold: 8,
    unit: 'pairs',
    costPrice: 65.0,
  },
  {
    key: 'buildco_pvc_pipe_4',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_plumbing',
    name: 'PVC Pipe 4" (3m length)',
    quantity: 60,
    lowStockThreshold: 20,
    unit: 'pcs',
    costPrice: 8.5,
  },
  {
    key: 'buildco_cable_2_5',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_electrical',
    name: 'Electrical Cable 2.5mm² (100m roll)',
    quantity: 25,
    lowStockThreshold: 8,
    unit: 'rolls',
    costPrice: 65.0,
  },
  {
    key: 'buildco_plywood_18mm',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_wood',
    name: 'Plywood 18mm (4x8 ft)',
    quantity: 45,
    lowStockThreshold: 15,
    unit: 'sheets',
    costPrice: 42.0,
  },
  {
    key: 'buildco_2x4_lumber',
    companyKey: 'buildco',
    categoryKey: 'buildco_cat_wood',
    name: 'Lumber 2x4 (12ft)',
    quantity: 120,
    lowStockThreshold: 40,
    unit: 'pcs',
    costPrice: 8.5,
  },
  {
    key: 'horizon_diesel',
    companyKey: 'horizon',
    categoryKey: 'horizon_cat_fuel',
    name: 'Diesel Fuel',
    quantity: 5000,
    lowStockThreshold: 1000,
    unit: 'liters',
    costPrice: 1.45,
  },
  {
    key: 'horizon_pallets_standard',
    companyKey: 'horizon',
    categoryKey: 'horizon_cat_packing',
    name: 'Standard Wooden Pallets',
    quantity: 200,
    lowStockThreshold: 50,
    unit: 'pcs',
    costPrice: 15.0,
  },
  {
    key: 'horizon_boxes_medium',
    companyKey: 'horizon',
    categoryKey: 'horizon_cat_packing',
    name: 'Corrugated Boxes Medium',
    quantity: 500,
    lowStockThreshold: 150,
    unit: 'pcs',
    costPrice: 1.5,
  },
  {
    key: 'horizon_tire_truck',
    companyKey: 'horizon',
    categoryKey: 'horizon_cat_maintenance',
    name: 'Truck Tire 295/80R22.5',
    quantity: 8,
    lowStockThreshold: 4,
    unit: 'pcs',
    costPrice: 450.0,
  },
  {
    key: 'green_tomato_seeds',
    companyKey: 'greenvalley',
    categoryKey: 'green_cat_seeds',
    name: 'Tomato Seeds (Hybrid)',
    quantity: 50,
    lowStockThreshold: 10,
    unit: 'packs',
    costPrice: 12.0,
  },
  {
    key: 'green_npk_fertilizer',
    companyKey: 'greenvalley',
    categoryKey: 'green_cat_fertilizer',
    name: 'NPK 15-15-15 Fertilizer',
    quantity: 2000,
    lowStockThreshold: 500,
    unit: 'kg',
    costPrice: 2.5,
  },
  {
    key: 'green_drip_tape',
    companyKey: 'greenvalley',
    categoryKey: 'green_cat_irrigation',
    name: 'Drip Irrigation Tape (1000m)',
    quantity: 25,
    lowStockThreshold: 8,
    unit: 'rolls',
    costPrice: 120.0,
  },
  {
    key: 'green_organic_compost',
    companyKey: 'greenvalley',
    categoryKey: 'green_cat_fertilizer',
    name: 'Organic Compost',
    quantity: 3000,
    lowStockThreshold: 500,
    unit: 'kg',
    costPrice: 0.8,
  },
  {
    key: 'green_poultry_feed',
    companyKey: 'greenvalley',
    categoryKey: 'green_cat_feed',
    name: 'Poultry Layer Feed 25kg',
    quantity: 40,
    lowStockThreshold: 10,
    unit: 'bags',
    costPrice: 22.0,
  },
  {
    key: 'urban_tshirt_white',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Cotton T-Shirt (White)',
    quantity: 85,
    lowStockThreshold: 20,
    unit: 'pcs',
    sellingPrice: 24.99,
    costPrice: 12.5,
  },
  {
    key: 'urban_tshirt_black',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Cotton T-Shirt (Black)',
    quantity: 92,
    lowStockThreshold: 20,
    unit: 'pcs',
    sellingPrice: 24.99,
    costPrice: 12.5,
  },
  {
    key: 'urban_jeans_blue',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Denim Jeans (Blue)',
    quantity: 42,
    lowStockThreshold: 15,
    unit: 'pcs',
    sellingPrice: 59.99,
    costPrice: 28.0,
  },
  {
    key: 'urban_jeans_black',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Denim Jeans (Black)',
    quantity: 38,
    lowStockThreshold: 15,
    unit: 'pcs',
    sellingPrice: 59.99,
    costPrice: 28.0,
  },
  {
    key: 'urban_jacket_black',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Winter Jacket (Black)',
    quantity: 18,
    lowStockThreshold: 10,
    unit: 'pcs',
    sellingPrice: 129.99,
    costPrice: 65.0,
  },
  {
    key: 'urban_jacket_navy',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Winter Jacket (Navy)',
    quantity: 15,
    lowStockThreshold: 10,
    unit: 'pcs',
    sellingPrice: 129.99,
    costPrice: 65.0,
  },
  {
    key: 'urban_sweater_gray',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Cashmere Blend Sweater (Gray)',
    quantity: 28,
    lowStockThreshold: 10,
    unit: 'pcs',
    sellingPrice: 79.99,
    costPrice: 38.0,
  },
  {
    key: 'urban_dress_red',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_clothing',
    name: 'Evening Dress (Red)',
    quantity: 12,
    lowStockThreshold: 5,
    unit: 'pcs',
    sellingPrice: 149.99,
    costPrice: 65.0,
  },
  {
    key: 'urban_belt_leather',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_accessories',
    name: 'Leather Belt (Brown)',
    quantity: 35,
    lowStockThreshold: 10,
    unit: 'pcs',
    sellingPrice: 39.99,
    costPrice: 15.0,
  },
  {
    key: 'urban_scarf_silk',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_accessories',
    name: 'Silk Scarf (Assorted)',
    quantity: 45,
    lowStockThreshold: 15,
    unit: 'pcs',
    sellingPrice: 49.99,
    costPrice: 18.0,
  },
  {
    key: 'urban_wallet',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_accessories',
    name: 'Genuine Leather Wallet',
    quantity: 25,
    lowStockThreshold: 8,
    unit: 'pcs',
    sellingPrice: 45.99,
    costPrice: 20.0,
  },
  {
    key: 'urban_sneakers_white',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_footwear',
    name: 'White Sneakers',
    quantity: 22,
    lowStockThreshold: 8,
    unit: 'pairs',
    sellingPrice: 89.99,
    costPrice: 42.0,
  },
  {
    key: 'urban_boots_chelsea',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_footwear',
    name: 'Chelsea Boots (Brown)',
    quantity: 14,
    lowStockThreshold: 5,
    unit: 'pairs',
    sellingPrice: 159.99,
    costPrice: 75.0,
  },
  {
    key: 'urban_bag_shopping',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_packaging',
    name: 'Shopping Bags (Pack of 100)',
    quantity: 50,
    lowStockThreshold: 15,
    unit: 'packs',
    costPrice: 12.0,
  },
  {
    key: 'urban_box_gift',
    companyKey: 'urban_threads',
    categoryKey: 'urban_cat_packaging',
    name: 'Gift Boxes (Pack of 25)',
    quantity: 30,
    lowStockThreshold: 10,
    unit: 'packs',
    costPrice: 18.0,
  },
  {
    key: 'buildmart_drill_cordless',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_tools',
    name: 'DeWalt 20V Cordless Drill',
    quantity: 25,
    lowStockThreshold: 8,
    unit: 'pcs',
    sellingPrice: 129.99,
    costPrice: 75.0,
    isTool: true,
  },
  {
    key: 'buildmart_circular_saw',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_tools',
    name: 'Makita Circular Saw 7-1/4"',
    quantity: 15,
    lowStockThreshold: 5,
    unit: 'pcs',
    sellingPrice: 149.99,
    costPrice: 85.0,
    isTool: true,
  },
  {
    key: 'buildmart_angle_grinder',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_tools',
    name: 'Bosch Angle Grinder 4-1/2"',
    quantity: 20,
    lowStockThreshold: 6,
    unit: 'pcs',
    sellingPrice: 79.99,
    costPrice: 45.0,
    isTool: true,
  },
  {
    key: 'buildmart_hammer_claw',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_handtools',
    name: 'Claw Hammer 16oz',
    quantity: 40,
    lowStockThreshold: 15,
    unit: 'pcs',
    sellingPrice: 24.99,
    costPrice: 12.0,
    isTool: true,
  },
  {
    key: 'buildmart_screwdriver_set',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_handtools',
    name: 'Screwdriver Set 32pc',
    quantity: 30,
    lowStockThreshold: 10,
    unit: 'sets',
    sellingPrice: 34.99,
    costPrice: 16.0,
    isTool: true,
  },
  {
    key: 'buildmart_wrench_set',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_handtools',
    name: 'Combination Wrench Set 14pc',
    quantity: 22,
    lowStockThreshold: 8,
    unit: 'sets',
    sellingPrice: 49.99,
    costPrice: 24.0,
    isTool: true,
  },
  {
    key: 'buildmart_nails_assorted',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_hardware',
    name: 'Nails Assorted Box',
    quantity: 100,
    lowStockThreshold: 30,
    unit: 'boxes',
    sellingPrice: 12.99,
    costPrice: 6.0,
  },
  {
    key: 'buildmart_screws_assorted',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_hardware',
    name: 'Screws Assorted Box',
    quantity: 80,
    lowStockThreshold: 25,
    unit: 'boxes',
    sellingPrice: 14.99,
    costPrice: 7.0,
  },
  {
    key: 'buildmart_paint_white_5l',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_paint',
    name: 'Interior Paint White 5L',
    quantity: 60,
    lowStockThreshold: 20,
    unit: 'pcs',
    sellingPrice: 32.99,
    costPrice: 18.0,
  },
  {
    key: 'buildmart_paint_roller',
    companyKey: 'home_depot_mini',
    categoryKey: 'buildmart_cat_paint',
    name: 'Paint Roller Set',
    quantity: 35,
    lowStockThreshold: 12,
    unit: 'sets',
    sellingPrice: 15.99,
    costPrice: 7.0,
    isTool: true,
  },
];

const STORE_TRANSACTIONS: StoreTransactionData[] = [
  {
    itemKey: 'buildco_cement_50kg',
    companyKey: 'buildco',
    type: StoreTxType.RESTOCK,
    quantity: 300,
    status: 'APPROVED',
    daysAgoDate: 30,
    note: 'Bulk cement delivery',
  },
  {
    itemKey: 'buildco_cement_50kg',
    companyKey: 'buildco',
    type: StoreTxType.ISSUE,
    quantity: 50,
    status: 'APPROVED',
    daysAgoDate: 20,
    issuedToUserKey: 'foreman_marcus',
    note: 'For skyscraper foundation',
  },
  {
    itemKey: 'buildco_cement_50kg',
    companyKey: 'buildco',
    type: StoreTxType.ISSUE,
    quantity: 30,
    status: 'APPROVED',
    daysAgoDate: 15,
    issuedToUserKey: 'foreman_omar',
    note: 'For bridge abutments',
  },
  {
    itemKey: 'buildco_rebar_t12',
    companyKey: 'buildco',
    type: StoreTxType.RESTOCK,
    quantity: 100,
    status: 'APPROVED',
    daysAgoDate: 45,
    note: 'Steel delivery from supplier',
  },
  {
    itemKey: 'buildco_rebar_t12',
    companyKey: 'buildco',
    type: StoreTxType.ISSUE,
    quantity: 40,
    status: 'APPROVED',
    daysAgoDate: 25,
    issuedToUserKey: 'foreman_marcus',
    note: 'For columns level 1-3',
  },
  {
    itemKey: 'buildco_sand',
    companyKey: 'buildco',
    type: StoreTxType.RESTOCK,
    quantity: 40,
    status: 'APPROVED',
    daysAgoDate: 20,
    note: 'Sand delivery',
  },
  {
    itemKey: 'buildco_helmet',
    companyKey: 'buildco',
    type: StoreTxType.ISSUE,
    quantity: 10,
    status: 'APPROVED',
    daysAgoDate: 8,
    issuedToUserKey: 'foreman_derek',
    note: 'New workers PPE',
  },
  {
    itemKey: 'buildco_2x4_lumber',
    companyKey: 'buildco',
    type: StoreTxType.RESTOCK,
    quantity: 100,
    status: 'APPROVED',
    daysAgoDate: 35,
  },
  {
    itemKey: 'horizon_diesel',
    companyKey: 'horizon',
    type: StoreTxType.RESTOCK,
    quantity: 3000,
    status: 'APPROVED',
    daysAgoDate: 5,
    note: 'Weekly fuel delivery',
  },
  {
    itemKey: 'horizon_diesel',
    companyKey: 'horizon',
    type: StoreTxType.ISSUE,
    quantity: 500,
    status: 'APPROVED',
    daysAgoDate: 3,
    issuedToUserKey: 'driver_pete',
    note: 'Truck #1 refueling',
  },
  {
    itemKey: 'horizon_diesel',
    companyKey: 'horizon',
    type: StoreTxType.ISSUE,
    quantity: 450,
    status: 'APPROVED',
    daysAgoDate: 2,
    issuedToUserKey: 'driver_sam',
    note: 'Truck #2 refueling',
  },
  {
    itemKey: 'horizon_pallets_standard',
    companyKey: 'horizon',
    type: StoreTxType.RESTOCK,
    quantity: 100,
    status: 'APPROVED',
    daysAgoDate: 15,
  },
  {
    itemKey: 'horizon_boxes_medium',
    companyKey: 'horizon',
    type: StoreTxType.RESTOCK,
    quantity: 300,
    status: 'APPROVED',
    daysAgoDate: 20,
  },
  {
    itemKey: 'green_npk_fertilizer',
    companyKey: 'greenvalley',
    type: StoreTxType.RESTOCK,
    quantity: 1000,
    status: 'APPROVED',
    daysAgoDate: 25,
    note: 'Seasonal fertilizer order',
  },
  {
    itemKey: 'green_drip_tape',
    companyKey: 'greenvalley',
    type: StoreTxType.RESTOCK,
    quantity: 15,
    status: 'APPROVED',
    daysAgoDate: 40,
  },
  {
    itemKey: 'green_poultry_feed',
    companyKey: 'greenvalley',
    type: StoreTxType.RESTOCK,
    quantity: 20,
    status: 'APPROVED',
    daysAgoDate: 10,
  },
  {
    itemKey: 'urban_tshirt_white',
    companyKey: 'urban_threads',
    type: StoreTxType.RESTOCK,
    quantity: 100,
    status: 'APPROVED',
    daysAgoDate: 20,
    note: 'Monthly restock',
  },
  {
    itemKey: 'urban_jeans_blue',
    companyKey: 'urban_threads',
    type: StoreTxType.RESTOCK,
    quantity: 50,
    status: 'APPROVED',
    daysAgoDate: 20,
  },
  {
    itemKey: 'urban_jacket_black',
    companyKey: 'urban_threads',
    type: StoreTxType.RESTOCK,
    quantity: 20,
    status: 'APPROVED',
    daysAgoDate: 20,
  },
];

const STORE_REQUESTS: StoreRequestData[] = [
  {
    itemKey: 'buildco_rebar_t12',
    companyKey: 'buildco',
    userKey: 'foreman_marcus',
    quantity: 40,
    status: 'PENDING',
    note: 'Need for level 4-6 columns',
  },
  {
    itemKey: 'buildco_rebar_t16',
    companyKey: 'buildco',
    userKey: 'foreman_omar',
    quantity: 25,
    status: 'PENDING',
    note: 'Bridge deck reinforcement',
  },
  {
    itemKey: 'buildco_cement_50kg',
    companyKey: 'buildco',
    userKey: 'foreman_derek',
    quantity: 60,
    status: 'APPROVED',
    note: 'Mall foundation work',
  },
  {
    itemKey: 'buildco_plywood_18mm',
    companyKey: 'buildco',
    userKey: 'foreman_marcus',
    quantity: 20,
    status: 'PENDING',
    note: 'Formwork for level 4',
  },
  {
    itemKey: 'horizon_diesel',
    companyKey: 'horizon',
    userKey: 'driver_rick',
    quantity: 200,
    status: 'APPROVED',
    note: 'Van fueling',
  },
  {
    itemKey: 'horizon_pallets_standard',
    companyKey: 'horizon',
    userKey: 'driver_pete',
    quantity: 20,
    status: 'PENDING',
    note: 'Upcoming shipment prep',
  },
  {
    itemKey: 'green_tomato_seeds',
    companyKey: 'greenvalley',
    userKey: 'op_farm_1',
    quantity: 10,
    status: 'PENDING',
    note: 'Next season planting',
  },
  {
    itemKey: 'green_organic_compost',
    companyKey: 'greenvalley',
    userKey: 'op_farm_1',
    quantity: 1000,
    status: 'APPROVED',
    note: 'Field preparation',
  },
  {
    itemKey: 'urban_sweater_gray',
    companyKey: 'urban_threads',
    userKey: 'sales_emma',
    quantity: 15,
    status: 'PENDING',
    note: 'Low stock - selling fast',
  },
  {
    itemKey: 'urban_sneakers_white',
    companyKey: 'urban_threads',
    userKey: 'sales_nina',
    quantity: 10,
    status: 'REJECTED',
    note: 'Budget constraint - defer to next month',
  },
];

export async function seedStoreInventory(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('📦 Seeding Store Inventory...');

  // Create a default store for each company (named after the company)
  const companyKeys = ['buildco', 'horizon', 'greenvalley', 'urban_threads', 'tech_mfg'];
  for (const ck of companyKeys) {
    const companyId = ctx.companies[ck];
    if (!companyId) continue;
    // Use company name from seed data
    const companyNames: Record<string, string> = {
      buildco: 'BuildCo Construction',
      horizon: 'Horizon Logistics',
      greenvalley: 'Green Valley Farms',
      urban_threads: 'Urban Threads',
      tech_mfg: 'TechMFG',
    };
    const store = await prisma.store.create({
      data: {
        name: companyNames[ck] || 'Main Store',
        companyId,
        description: 'Default company store',
        storekeeperId: ctx.users['sk_alex'] || null,
      },
    });
    ctx.stores = ctx.stores || {};
    ctx.stores[`${ck}_main`] = store.id;
  }

  // Create project-scoped stores for any project that doesn't have one yet
  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true, companyId: true },
  });
  for (const p of allProjects) {
    const existing = await prisma.store.findFirst({
      where: { projectId: p.id },
    });
    if (!existing) {
      await prisma.store.create({
        data: { name: p.name, companyId: p.companyId, projectId: p.id },
      });
    }
  }
  console.log(`   ✅ Created stores for ${allProjects.length} projects`);

  for (const cat of STORE_CATEGORIES) {
    const created = await prisma.storeCategory.create({
      data: { companyId: ctx.companies[cat.companyKey], name: cat.name },
    });
    ctx.storeCategories[cat.key] = created.id;
  }

  for (const item of STORE_ITEMS) {
    const created = await prisma.storeItem.create({
      data: {
        companyId: ctx.companies[item.companyKey],
        storeId: ctx.stores[`${item.companyKey}_main`],
        name: item.name,
        categoryId: ctx.storeCategories[item.categoryKey],
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        unit: item.unit,
        sellingPrice: item.sellingPrice || 0,
        costPrice: item.costPrice || 0,
        isTool: item.isTool || false,
      },
    });
    ctx.storeItems[item.key] = created.id;
  }

  await prisma.storeTransaction.createMany({
    data: STORE_TRANSACTIONS.map((t) => ({
      itemId: ctx.storeItems[t.itemKey],
      companyId: ctx.companies[t.companyKey],
      type: t.type,
      quantity: t.quantity,
      status: t.status,
      date: daysAgo(t.daysAgoDate),
      issuedToUserId: t.issuedToUserKey ? ctx.users[t.issuedToUserKey] : null,
      note: t.note,
    })),
  });

  await prisma.storeRequest.createMany({
    data: STORE_REQUESTS.map((r) => ({
      itemId: ctx.storeItems[r.itemKey],
      companyId: ctx.companies[r.companyKey],
      userId: ctx.users[r.userKey],
      quantity: r.quantity,
      status: r.status,
      note: r.note || null,
    })),
  });

  console.log(
    `   ✅ Created ${STORE_CATEGORIES.length} categories, ${STORE_ITEMS.length} items`,
  );
  console.log(
    `   ✅ Created ${STORE_TRANSACTIONS.length} transactions, ${STORE_REQUESTS.length} requests`,
  );
}

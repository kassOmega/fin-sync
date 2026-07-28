import { CompanyType, PrismaClient, SystemRole } from '@prisma/client';
import { SeedContext } from './utils';

interface CompanyData {
  key: string;
  name: string;
  industry: string;
  type: CompanyType;
  currency: string;
  ownerKey: string;
}

interface MemberData {
  userKey: string;
  companyKey: string;
  role: SystemRole;
}

const COMPANIES: CompanyData[] = [
  {
    key: 'buildco',
    name: 'BuildCo Construction',
    industry: 'Commercial & Residential Construction',
    type: CompanyType.CONSTRUCTION,
    currency: 'USD',
    ownerKey: 'owner_john',
  },
  {
    key: 'horizon',
    name: 'Horizon Freight & Logistics',
    industry: 'Transportation & Warehousing',
    type: CompanyType.LOGISTICS,
    currency: 'USD',
    ownerKey: 'owner_sarah',
  },
  {
    key: 'greenvalley',
    name: 'GreenValley Farms',
    industry: 'Agriculture & Farming',
    type: CompanyType.AGRICULTURE,
    currency: 'USD',
    ownerKey: 'owner_mike',
  },
  {
    key: 'urban_threads',
    name: 'Urban Threads Boutique',
    industry: 'Retail / Fashion',
    type: CompanyType.RETAIL,
    currency: 'USD',
    ownerKey: 'owner_lisa',
  },
  {
    key: 'tech_mfg',
    name: 'TechManufacture Inc.',
    industry: 'Electronics Manufacturing',
    type: CompanyType.MANUFACTURING,
    currency: 'USD',
    ownerKey: 'owner_ahmed',
  },
  {
    key: 'pro_services',
    name: 'ProServices Consulting',
    industry: 'Business Consulting & IT Services',
    type: CompanyType.SERVICE,
    currency: 'USD',
    ownerKey: 'owner_john',
  },
  {
    key: 'home_depot_mini',
    name: 'BuildMart Supply Store',
    industry: 'Hardware & Building Materials Retail',
    type: CompanyType.RETAIL,
    currency: 'USD',
    ownerKey: 'owner_john',
  },
  {
    key: 'fresh_eats',
    name: 'Fresh Eats Restaurant',
    industry: 'Food & Beverage',
    type: CompanyType.SERVICE,
    currency: 'USD',
    ownerKey: 'owner_lisa',
  },
];

const MEMBERS: MemberData[] = [
  // BuildCo members
  {
    userKey: 'pm_alex',
    companyKey: 'buildco',
    role: SystemRole.ProjectManager,
  },
  {
    userKey: 'pm_rachel',
    companyKey: 'buildco',
    role: SystemRole.ProjectManager,
  },
  {
    userKey: 'foreman_marcus',
    companyKey: 'buildco',
    role: SystemRole.Foreman,
  },
  { userKey: 'foreman_omar', companyKey: 'buildco', role: SystemRole.Foreman },
  { userKey: 'foreman_derek', companyKey: 'buildco', role: SystemRole.Foreman },
  { userKey: 'store_bob', companyKey: 'buildco', role: SystemRole.Storekeeper },
  { userKey: 'cashier_jane', companyKey: 'buildco', role: SystemRole.Cashier },
  {
    userKey: 'op_david',
    companyKey: 'buildco',
    role: SystemRole.OperatorDriver,
  },
  {
    userKey: 'op_kenji',
    companyKey: 'buildco',
    role: SystemRole.OperatorDriver,
  },

  // Horizon Logistics members
  {
    userKey: 'pm_james',
    companyKey: 'horizon',
    role: SystemRole.ProjectManager,
  },
  { userKey: 'cashier_tom', companyKey: 'horizon', role: SystemRole.Cashier },
  {
    userKey: 'driver_pete',
    companyKey: 'horizon',
    role: SystemRole.OperatorDriver,
  },
  {
    userKey: 'driver_sam',
    companyKey: 'horizon',
    role: SystemRole.OperatorDriver,
  },
  {
    userKey: 'driver_rick',
    companyKey: 'horizon',
    role: SystemRole.OperatorDriver,
  },

  // GreenValley Farms members
  {
    userKey: 'store_chris',
    companyKey: 'greenvalley',
    role: SystemRole.Storekeeper,
  },
  {
    userKey: 'op_farm_1',
    companyKey: 'greenvalley',
    role: SystemRole.OperatorDriver,
  },

  // Urban Threads members
  {
    userKey: 'sales_emma',
    companyKey: 'urban_threads',
    role: SystemRole.Sales,
  },
  {
    userKey: 'sales_nina',
    companyKey: 'urban_threads',
    role: SystemRole.Sales,
  },
  {
    userKey: 'sales_ryan',
    companyKey: 'urban_threads',
    role: SystemRole.Sales,
  },
  {
    userKey: 'store_anna',
    companyKey: 'urban_threads',
    role: SystemRole.Storekeeper,
  },
  {
    userKey: 'cashier_maria',
    companyKey: 'urban_threads',
    role: SystemRole.Cashier,
  },

  // TechManufacture members
  { userKey: 'sales_jake', companyKey: 'tech_mfg', role: SystemRole.Sales },
  { userKey: 'cashier_jane', companyKey: 'tech_mfg', role: SystemRole.Cashier },

  // BuildMart Supply Store members
  {
    userKey: 'store_bob',
    companyKey: 'home_depot_mini',
    role: SystemRole.Storekeeper,
  },
  {
    userKey: 'sales_emma',
    companyKey: 'home_depot_mini',
    role: SystemRole.Sales,
  },
  {
    userKey: 'cashier_jane',
    companyKey: 'home_depot_mini',
    role: SystemRole.Cashier,
  },

  // Fresh Eats members
  {
    userKey: 'cashier_maria',
    companyKey: 'fresh_eats',
    role: SystemRole.Cashier,
  },
  {
    userKey: 'store_anna',
    companyKey: 'fresh_eats',
    role: SystemRole.Storekeeper,
  },
];

export async function seedCompanies(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🏢 Seeding Companies & Memberships...');

  // Create companies
  for (const company of COMPANIES) {
    const created = await prisma.company.create({
      data: {
        name: company.name,
        industry: company.industry,
        type: company.type,
        currency: company.currency,
        ownerId: ctx.users[company.ownerKey],
      },
    });
    ctx.companies[company.key] = created.id;
  }

  // Create memberships
  await prisma.companyMember.createMany({
    data: MEMBERS.map((m) => ({
      userId: ctx.users[m.userKey],
      companyId: ctx.companies[m.companyKey],
      role: m.role,
    })),
  });

  console.log(
    `   ✅ Created ${COMPANIES.length} companies and ${MEMBERS.length} memberships`,
  );
}

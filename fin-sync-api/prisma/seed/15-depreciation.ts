import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

const METHODS = [
  {
    name: 'Straight-Line',
    type: 'STRAIGHT_LINE',
    defaultRate: 20,
    defaultUsefulLifeYears: 5,
  },
  {
    name: 'Declining Balance',
    type: 'DECLINING_BALANCE',
    defaultRate: 30,
    defaultUsefulLifeYears: 5,
  },
];

// Machinery key → depreciation config
const MACHINERY_CONFIGS: Record<
  string,
  {
    purchaseCost: number;
    residualValue: number;
    usefulLifeYears: number;
    method: string;
  }
> = {
  buildco_excavator_1: {
    purchaseCost: 350000,
    residualValue: 35000,
    usefulLifeYears: 8,
    method: 'Straight-Line',
  },
  buildco_crane_1: {
    purchaseCost: 1200000,
    residualValue: 120000,
    usefulLifeYears: 10,
    method: 'Straight-Line',
  },
  buildco_mixer_1: {
    purchaseCost: 180000,
    residualValue: 18000,
    usefulLifeYears: 7,
    method: 'Straight-Line',
  },
  horizon_truck_1: {
    purchaseCost: 250000,
    residualValue: 25000,
    usefulLifeYears: 8,
    method: 'Declining Balance',
  },
  horizon_truck_2: {
    purchaseCost: 240000,
    residualValue: 24000,
    usefulLifeYears: 8,
    method: 'Declining Balance',
  },
  green_tractor_1: {
    purchaseCost: 220000,
    residualValue: 22000,
    usefulLifeYears: 6,
    method: 'Straight-Line',
  },
  green_harvester: {
    purchaseCost: 450000,
    residualValue: 45000,
    usefulLifeYears: 8,
    method: 'Straight-Line',
  },
  techmfg_smt_1: {
    purchaseCost: 800000,
    residualValue: 80000,
    usefulLifeYears: 10,
    method: 'Straight-Line',
  },
  techmfg_smt_2: {
    purchaseCost: 750000,
    residualValue: 75000,
    usefulLifeYears: 10,
    method: 'Straight-Line',
  },
};

export async function seedDepreciation(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('📉 Seeding Depreciation...');

  const companyKeys = Object.keys(ctx.companies);
  let methodCount = 0;
  let configCount = 0;

  for (const companyKey of companyKeys) {
    const companyId = Number(ctx.companies[companyKey]);

    // Create depreciation methods via raw SQL (company-linked, works with stale client)
    const methodMap = new Map<string, number>();
    for (const m of METHODS) {
      const existing: { id: number }[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM finsync.depreciation_methods WHERE "companyId" = ${companyId} AND name = '${m.name}' LIMIT 1`,
      );
      if (existing.length > 0) {
        methodMap.set(m.name, existing[0].id);
      } else {
        const inserted: { id: number }[] = await prisma.$queryRawUnsafe(
          `INSERT INTO finsync.depreciation_methods ("companyId", name, type, "defaultRate", "defaultUsefulLifeYears")
           VALUES (${companyId}, '${m.name}', '${m.type}', ${m.defaultRate}, ${m.defaultUsefulLifeYears})
           RETURNING id`,
        );
        methodMap.set(m.name, inserted[0].id);
        methodCount++;
      }
    }

    // Enable depreciation on configured machines
    for (const [machKey, config] of Object.entries(MACHINERY_CONFIGS)) {
      const machineryId = ctx.machinery[machKey];
      if (!machineryId) continue;

      const machine: any = await (prisma as any).machinery.findUnique({
        where: { id: Number(machineryId) },
      });
      if (!machine || machine.companyId !== companyId) continue;

      const methodId = methodMap.get(config.method);
      if (!methodId) continue;

      const alreadyConfigured = await (prisma as any).machinery.findFirst({
        where: { id: Number(machineryId), depreciationEnabled: true },
      });
      if (alreadyConfigured) continue;

      await (prisma as any).machinery.update({
        where: { id: Number(machineryId) },
        data: {
          purchaseDate: new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000), // 3 years ago
          purchaseCost: config.purchaseCost,
          residualValue: config.residualValue,
          usefulLifeYears: config.usefulLifeYears,
          depMethodId: methodId,
          depreciationEnabled: true,
        },
      });
      configCount++;
    }
  }

  console.log(
    `   ✅ Seeded ${methodCount} methods, configured ${configCount} machines`,
  );
}

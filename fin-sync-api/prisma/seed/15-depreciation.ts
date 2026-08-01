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
  if (!(prisma as any).depreciationMethod) {
    console.log(
      '⚠️ depreciationMethod model not available — skipping Depreciation seed',
    );
    return;
  }
  console.log('📉 Seeding Depreciation...');

  const companyKeys = Object.keys(ctx.companies);
  let methodCount = 0;
  let configCount = 0;

  for (const companyKey of companyKeys) {
    const companyId = Number(ctx.companies[companyKey]);

    // Create depreciation methods
    const methodMap = new Map<string, number>();
    for (const m of METHODS) {
      const existing = await (prisma as any).depreciationMethod.findFirst({
        where: { companyId, name: m.name },
      });
      if (!existing) {
        const created = await (prisma as any).depreciationMethod.create({
          data: {
            companyId,
            name: m.name,
            type: m.type,
            defaultRate: m.defaultRate,
            defaultUsefulLifeYears: m.defaultUsefulLifeYears,
          },
        });
        methodMap.set(m.name, created.id);
        methodCount++;
      } else {
        methodMap.set(m.name, existing.id);
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

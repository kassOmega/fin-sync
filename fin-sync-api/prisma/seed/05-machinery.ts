import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

interface MachineryData {
  key: string;
  companyKey: string;
  name: string;
  code?: string;
  type: string;
  status: string;
  totalHoursRun: number;
  hourlyRate?: number;
  projectKey?: string;
}

const MACHINERY: MachineryData[] = [
  {
    key: 'buildco_excavator_1',
    companyKey: 'buildco',
    name: 'CAT 320 Heavy Excavator',
    code: 'MCH-001',
    type: 'EXCAVATOR',
    status: 'IN_USE',
    totalHoursRun: 1240.5,
    hourlyRate: 150,
    projectKey: 'buildco_skyscraper',
  },
  {
    key: 'buildco_excavator_2',
    companyKey: 'buildco',
    name: 'Komatsu PC200 Excavator',
    code: 'MCH-002',
    type: 'EXCAVATOR',
    status: 'IN_USE',
    totalHoursRun: 2100.0,
    hourlyRate: 140,
    projectKey: 'buildco_bridge',
  },
  {
    key: 'buildco_crane_1',
    companyKey: 'buildco',
    name: 'Liebherr LTM 1120 Crane',
    code: 'MCH-003',
    type: 'VEHICLE',
    status: 'UNDER_MAINTENANCE',
    totalHoursRun: 850.0,
    projectKey: 'buildco_skyscraper',
  },
  {
    key: 'buildco_crane_2',
    companyKey: 'buildco',
    name: 'Tower Crane TC-250',
    code: 'MCH-004',
    type: 'VEHICLE',
    status: 'IN_USE',
    totalHoursRun: 1500.0,
    projectKey: 'buildco_residential',
  },
  {
    key: 'buildco_bulldozer_1',
    companyKey: 'buildco',
    name: 'CAT D6T Bulldozer',
    code: 'MCH-005',
    type: 'BULLDOZER',
    status: 'AVAILABLE',
    totalHoursRun: 3200.0,
    hourlyRate: 130,
  },
  {
    key: 'buildco_loader_1',
    companyKey: 'buildco',
    name: 'Volvo L120H Wheel Loader',
    code: 'MCH-006',
    type: 'TRACTOR',
    status: 'IN_USE',
    totalHoursRun: 980.0,
    projectKey: 'buildco_mall',
  },
  {
    key: 'buildco_mixer_1',
    companyKey: 'buildco',
    name: 'Mercedes Actros Concrete Mixer',
    code: 'MCH-007',
    type: 'DUMPER_TRUCK',
    status: 'IN_USE',
    totalHoursRun: 4500.0,
    projectKey: 'buildco_skyscraper',
  },
  {
    key: 'buildco_compactor_1',
    companyKey: 'buildco',
    name: 'Hamm HD+ 120i Compactor',
    code: 'MCH-008',
    type: 'OTHER',
    status: 'IN_USE',
    totalHoursRun: 780.0,
    projectKey: 'buildco_bridge',
  },
  {
    key: 'horizon_truck_1',
    companyKey: 'horizon',
    name: 'Volvo FH16 750 Semi-Truck #1',
    code: 'MCH-009',
    type: 'DUMPER_TRUCK',
    status: 'IN_USE',
    totalHoursRun: 85000,
    hourlyRate: 200,
  },
  {
    key: 'horizon_truck_2',
    companyKey: 'horizon',
    name: 'Volvo FH16 750 Semi-Truck #2',
    code: 'MCH-010',
    type: 'DUMPER_TRUCK',
    status: 'IN_USE',
    totalHoursRun: 72000,
  },
  {
    key: 'horizon_van_1',
    companyKey: 'horizon',
    name: 'Mercedes Sprinter Van #1',
    code: 'MCH-011',
    type: 'VEHICLE',
    status: 'IN_USE',
    totalHoursRun: 35000,
  },
  {
    key: 'horizon_forklift_1',
    companyKey: 'horizon',
    name: 'Toyota 8FGU25 Forklift',
    type: 'OTHER',
    status: 'IN_USE',
    totalHoursRun: 5600,
  },
  {
    key: 'green_tractor_1',
    companyKey: 'greenvalley',
    name: 'John Deere 6R 320 Tractor',
    code: 'MCH-012',
    type: 'TRACTOR',
    status: 'IN_USE',
    totalHoursRun: 2100,
    projectKey: 'green_irrigation',
  },
  {
    key: 'green_harvester',
    companyKey: 'greenvalley',
    name: 'Case IH Axial-Flow 250 Combine',
    type: 'TRACTOR',
    status: 'UNDER_MAINTENANCE',
    totalHoursRun: 3500,
  },
  {
    key: 'techmfg_smt_1',
    companyKey: 'tech_mfg',
    name: 'Yamaha YSM20R SMT Line #1',
    code: 'MCH-013',
    type: 'GENERATOR',
    status: 'IN_USE',
    totalHoursRun: 15000,
    projectKey: 'techmfg_pcb',
  },
  {
    key: 'techmfg_smt_2',
    companyKey: 'tech_mfg',
    name: 'Yamaha YSM20R SMT Line #2',
    code: 'MCH-014',
    type: 'GENERATOR',
    status: 'IN_USE',
    totalHoursRun: 12000,
    projectKey: 'techmfg_pcb',
  },
];
export async function seedMachinery(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🚜 Seeding Machinery...');

  for (const m of MACHINERY) {
    const code = m.code ? `'${m.code}'` : 'NULL';
    const rate = m.hourlyRate ?? 'NULL';
    const pid = m.projectKey ? `'${ctx.projects[m.projectKey]}'` : 'NULL';
    const companyId = `'${ctx.companies[m.companyKey]}'`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO finsync.machineries ("companyId", name, code, type, status, "totalHoursRun", "hourlyRate", "projectId", "created_at", "updated_at")
       VALUES (${companyId}, '${m.name}', ${code}, '${m.type}', '${m.status}', ${m.totalHoursRun}, ${rate}, ${pid}, NOW(), NOW())`,
    );

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM finsync.machineries ORDER BY id DESC LIMIT 1`,
    );
    ctx.machinery[m.key] = rows[0].id;
  }

  console.log(`   ✅ Created ${MACHINERY.length} machinery`);
}

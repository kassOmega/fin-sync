import {
  MachineryOwnership,
  MachineryStatus,
  PrismaClient,
} from '@prisma/client';
import { SeedContext } from './utils';

interface MachineryData {
  key: string;
  companyKey: string;
  name: string;
  category: string;
  status: MachineryStatus;
  ownership: MachineryOwnership;
  runningHours: number;
  lastMaintenanceHours: number;
  projectKey?: string;
}

interface OperatorData {
  machineryKey: string;
  userKey: string;
  isHelper: boolean;
}

const MACHINERY: MachineryData[] = [
  {
    key: 'buildco_excavator_1',
    companyKey: 'buildco',
    name: 'CAT 320 Heavy Excavator',
    category: 'Excavation',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 1240.5,
    lastMaintenanceHours: 1100.0,
    projectKey: 'buildco_skyscraper',
  },
  {
    key: 'buildco_excavator_2',
    companyKey: 'buildco',
    name: 'Komatsu PC200 Excavator',
    category: 'Excavation',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 2100.0,
    lastMaintenanceHours: 1950.0,
    projectKey: 'buildco_bridge',
  },
  {
    key: 'buildco_crane_1',
    companyKey: 'buildco',
    name: 'Liebherr LTM 1120 Crane',
    category: 'Lifting Equipment',
    status: MachineryStatus.MAINTENANCE,
    ownership: MachineryOwnership.RENTED,
    runningHours: 850.0,
    lastMaintenanceHours: 850.0,
    projectKey: 'buildco_skyscraper',
  },
  {
    key: 'buildco_crane_2',
    companyKey: 'buildco',
    name: 'Tower Crane TC-250',
    category: 'Lifting Equipment',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.RENTED,
    runningHours: 1500.0,
    lastMaintenanceHours: 1350.0,
    projectKey: 'buildco_residential',
  },
  {
    key: 'buildco_bulldozer_1',
    companyKey: 'buildco',
    name: 'CAT D6T Bulldozer',
    category: 'Earth Moving',
    status: MachineryStatus.IDLE,
    ownership: MachineryOwnership.OWNED,
    runningHours: 3200.0,
    lastMaintenanceHours: 3000.0,
  },
  {
    key: 'buildco_loader_1',
    companyKey: 'buildco',
    name: 'Volvo L120H Wheel Loader',
    category: 'Material Handling',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 980.0,
    lastMaintenanceHours: 900.0,
    projectKey: 'buildco_mall',
  },
  {
    key: 'buildco_mixer_1',
    companyKey: 'buildco',
    name: 'Mercedes-Benz Actros Concrete Mixer',
    category: 'Concrete Equipment',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 4500.0,
    lastMaintenanceHours: 4200.0,
    projectKey: 'buildco_skyscraper',
  },
  {
    key: 'buildco_pump_1',
    companyKey: 'buildco',
    name: 'Putzmeister BSF 36 Concrete Pump',
    category: 'Concrete Equipment',
    status: MachineryStatus.IDLE,
    ownership: MachineryOwnership.RENTED,
    runningHours: 600.0,
    lastMaintenanceHours: 500.0,
  },
  {
    key: 'buildco_compactor_1',
    companyKey: 'buildco',
    name: 'Hamm HD+ 120i Compactor',
    category: 'Compaction',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 780.0,
    lastMaintenanceHours: 700.0,
    projectKey: 'buildco_bridge',
  },
  {
    key: 'horizon_truck_1',
    companyKey: 'horizon',
    name: 'Volvo FH16 750 Semi-Truck #1',
    category: 'Heavy Transport',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 85000,
    lastMaintenanceHours: 82000,
  },
  {
    key: 'horizon_truck_2',
    companyKey: 'horizon',
    name: 'Volvo FH16 750 Semi-Truck #2',
    category: 'Heavy Transport',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 72000,
    lastMaintenanceHours: 69500,
  },
  {
    key: 'horizon_truck_3',
    companyKey: 'horizon',
    name: 'Scania R500 Semi-Truck #3',
    category: 'Heavy Transport',
    status: MachineryStatus.MAINTENANCE,
    ownership: MachineryOwnership.OWNED,
    runningHours: 120000,
    lastMaintenanceHours: 120000,
  },
  {
    key: 'horizon_truck_4',
    companyKey: 'horizon',
    name: 'Freightliner Cascadia #4',
    category: 'Long Haul',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.RENTED,
    runningHours: 45000,
    lastMaintenanceHours: 43000,
  },
  {
    key: 'horizon_van_1',
    companyKey: 'horizon',
    name: 'Mercedes Sprinter Van #1',
    category: 'Last Mile Delivery',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 35000,
    lastMaintenanceHours: 33000,
  },
  {
    key: 'horizon_van_2',
    companyKey: 'horizon',
    name: 'Mercedes Sprinter Van #2',
    category: 'Last Mile Delivery',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 28000,
    lastMaintenanceHours: 26000,
  },
  {
    key: 'horizon_forklift_1',
    companyKey: 'horizon',
    name: 'Toyota 8FGU25 Forklift',
    category: 'Warehouse Equipment',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 5600,
    lastMaintenanceHours: 5200,
  },
  {
    key: 'horizon_forklift_2',
    companyKey: 'horizon',
    name: 'Crown RC 5500 Reach Truck',
    category: 'Warehouse Equipment',
    status: MachineryStatus.IDLE,
    ownership: MachineryOwnership.OWNED,
    runningHours: 4200,
    lastMaintenanceHours: 4000,
  },
  {
    key: 'green_tractor_1',
    companyKey: 'greenvalley',
    name: 'John Deere 6R 320 Tractor',
    category: 'Farming Equipment',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 2100,
    lastMaintenanceHours: 1900,
    projectKey: 'green_irrigation',
  },
  {
    key: 'green_tractor_2',
    companyKey: 'greenvalley',
    name: 'Kubota M7-172 Tractor',
    category: 'Farming Equipment',
    status: MachineryStatus.IDLE,
    ownership: MachineryOwnership.OWNED,
    runningHours: 1800,
    lastMaintenanceHours: 1650,
  },
  {
    key: 'green_harvester',
    companyKey: 'greenvalley',
    name: 'Case IH Axial-Flow 250 Combine',
    category: 'Harvesting Equipment',
    status: MachineryStatus.MAINTENANCE,
    ownership: MachineryOwnership.OWNED,
    runningHours: 3500,
    lastMaintenanceHours: 3500,
  },
  {
    key: 'green_sprayer',
    companyKey: 'greenvalley',
    name: 'John Deere R4045i Sprayer',
    category: 'Crop Protection',
    status: MachineryStatus.IDLE,
    ownership: MachineryOwnership.RENTED,
    runningHours: 800,
    lastMaintenanceHours: 750,
  },
  {
    key: 'green_plow',
    companyKey: 'greenvalley',
    name: 'Lemken Juwel 8 Mouldboard Plow',
    category: 'Tillage Equipment',
    status: MachineryStatus.IDLE,
    ownership: MachineryOwnership.OWNED,
    runningHours: 1200,
    lastMaintenanceHours: 1100,
  },
  {
    key: 'techmfg_smt_1',
    companyKey: 'tech_mfg',
    name: 'Yamaha YSM20R SMT Line #1',
    category: 'Manufacturing Equipment',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 15000,
    lastMaintenanceHours: 14000,
    projectKey: 'techmfg_pcb',
  },
  {
    key: 'techmfg_smt_2',
    companyKey: 'tech_mfg',
    name: 'Yamaha YSM20R SMT Line #2',
    category: 'Manufacturing Equipment',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 12000,
    lastMaintenanceHours: 11200,
    projectKey: 'techmfg_pcb',
  },
  {
    key: 'techmfg_oven',
    companyKey: 'tech_mfg',
    name: 'Heller 1913 MK5 Reflow Oven',
    category: 'Manufacturing Equipment',
    status: MachineryStatus.WORKING,
    ownership: MachineryOwnership.OWNED,
    runningHours: 18000,
    lastMaintenanceHours: 17000,
  },
  {
    key: 'techmfg_aoi',
    companyKey: 'tech_mfg',
    name: 'Mirtec MV9 AOI System',
    category: 'Quality Control',
    status: MachineryStatus.IDLE,
    ownership: MachineryOwnership.OWNED,
    runningHours: 8000,
    lastMaintenanceHours: 7500,
  },
];

const OPERATORS: OperatorData[] = [
  { machineryKey: 'buildco_excavator_1', userKey: 'op_david', isHelper: false },
  { machineryKey: 'buildco_excavator_2', userKey: 'op_kenji', isHelper: false },
  { machineryKey: 'buildco_mixer_1', userKey: 'op_david', isHelper: true },
  { machineryKey: 'buildco_loader_1', userKey: 'op_kenji', isHelper: true },
  { machineryKey: 'horizon_truck_1', userKey: 'driver_pete', isHelper: false },
  { machineryKey: 'horizon_truck_2', userKey: 'driver_sam', isHelper: false },
  { machineryKey: 'horizon_truck_3', userKey: 'driver_rick', isHelper: false },
  { machineryKey: 'horizon_van_1', userKey: 'driver_rick', isHelper: false },
  { machineryKey: 'horizon_van_2', userKey: 'driver_pete', isHelper: false },
  { machineryKey: 'green_tractor_1', userKey: 'op_farm_1', isHelper: false },
  { machineryKey: 'green_tractor_2', userKey: 'op_farm_1', isHelper: false },
];

export async function seedMachinery(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🚜 Seeding Machinery & Operators...');

  for (const mach of MACHINERY) {
    const created = await prisma.machinery.create({
      data: {
        companyId: ctx.companies[mach.companyKey],
        name: mach.name,
        category: mach.category,
        status: mach.status,
        ownershipType: mach.ownership,
        runningHours: mach.runningHours,
        lastMaintenanceHours: mach.lastMaintenanceHours,
        projectId: mach.projectKey ? ctx.projects[mach.projectKey] : null,
      },
    });
    ctx.machinery[mach.key] = created.id;
  }

  await prisma.machineryOperator.createMany({
    data: OPERATORS.map((o) => ({
      machineryId: ctx.machinery[o.machineryKey],
      userId: ctx.users[o.userKey],
      isHelper: o.isHelper,
    })),
  });

  console.log(
    `   ✅ Created ${MACHINERY.length} machinery and ${OPERATORS.length} operator assignments`,
  );
}

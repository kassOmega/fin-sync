import { PrismaClient } from '@prisma/client';
import { SeedContext, daysAgo } from './utils';

interface ProjectData {
  key: string;
  companyKey: string;
  name: string;
  code?: string;
  status?: string;
  progress: number;
  budget?: number;
  startDaysAgo?: number;
  endDaysFromNow?: number;
}

interface ProjectUpdateData {
  projectKey: string;
  userKey: string;
  note: string;
  newProgress: number;
  daysAgoDate: number;
}

const PROJECTS: ProjectData[] = [
  {
    key: 'buildco_skyscraper',
    companyKey: 'buildco',
    name: 'Downtown Commercial Skyscraper',
    code: 'BLD-001',
    status: 'IN_PROGRESS',
    progress: 35,
    budget: 8500000,
    startDaysAgo: 200,
    endDaysFromNow: 400,
  },
  {
    key: 'buildco_residential',
    companyKey: 'buildco',
    name: 'Westside Residential Complex',
    code: 'BLD-002',
    status: 'IN_PROGRESS',
    progress: 78,
    budget: 4500000,
    startDaysAgo: 300,
    endDaysFromNow: 60,
  },
  {
    key: 'buildco_bridge',
    companyKey: 'buildco',
    name: 'Highway 101 Bridge Replacement',
    code: 'BLD-003',
    status: 'IN_PROGRESS',
    progress: 52,
    budget: 12000000,
    startDaysAgo: 180,
    endDaysFromNow: 300,
  },
  {
    key: 'buildco_mall',
    companyKey: 'buildco',
    name: 'Riverside Shopping Mall Extension',
    code: 'BLD-004',
    status: 'PLANNED',
    progress: 15,
    budget: 3200000,
    startDaysAgo: 90,
    endDaysFromNow: 500,
  },
  {
    key: 'horizon_warehouse',
    companyKey: 'horizon',
    name: 'Central Distribution Hub Build-out',
    code: 'HZN-001',
    status: 'IN_PROGRESS',
    progress: 65,
    budget: 1800000,
    startDaysAgo: 150,
    endDaysFromNow: 90,
  },
  {
    key: 'horizon_coldchain',
    companyKey: 'horizon',
    name: 'Cold Chain Infrastructure Upgrade',
    code: 'HZN-002',
    status: 'IN_PROGRESS',
    progress: 40,
    budget: 2500000,
    startDaysAgo: 120,
    endDaysFromNow: 180,
  },
  {
    key: 'horizon_fleet',
    companyKey: 'horizon',
    name: 'Electric Fleet Transition',
    code: 'HZN-003',
    status: 'PLANNED',
    progress: 25,
    budget: 5000000,
    startDaysAgo: 60,
    endDaysFromNow: 400,
  },
  {
    key: 'green_irrigation',
    companyKey: 'greenvalley',
    name: 'Smart Irrigation System Installation',
    code: 'GRN-001',
    status: 'IN_PROGRESS',
    progress: 80,
    budget: 750000,
    startDaysAgo: 200,
    endDaysFromNow: 30,
  },
  {
    key: 'green_greenhouse',
    companyKey: 'greenvalley',
    name: 'Year-Round Greenhouse Complex',
    code: 'GRN-002',
    status: 'IN_PROGRESS',
    progress: 45,
    budget: 1200000,
    startDaysAgo: 150,
    endDaysFromNow: 200,
  },
  {
    key: 'urban_winter',
    companyKey: 'urban_threads',
    name: 'Winter Collection Launch',
    status: 'COMPLETED',
    progress: 100,
    startDaysAgo: 120,
    endDaysFromNow: -10,
  },
  {
    key: 'urban_ecommerce',
    companyKey: 'urban_threads',
    name: 'E-Commerce Platform Setup',
    status: 'IN_PROGRESS',
    progress: 60,
    budget: 350000,
    startDaysAgo: 100,
    endDaysFromNow: 90,
  },
  {
    key: 'techmfg_pcb',
    companyKey: 'tech_mfg',
    name: 'PCB Assembly Line Expansion',
    code: 'TEC-001',
    status: 'IN_PROGRESS',
    progress: 70,
    budget: 3200000,
    startDaysAgo: 180,
    endDaysFromNow: 90,
  },
  {
    key: 'techmfg_iso',
    companyKey: 'tech_mfg',
    name: 'ISO 9001 Certification',
    code: 'TEC-002',
    status: 'ON_HOLD',
    progress: 35,
    budget: 1800000,
    startDaysAgo: 160,
    endDaysFromNow: 120,
  },
];

const PROJECT_UPDATES: ProjectUpdateData[] = [
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'pm_alex',
    note: 'Site clearing and foundation excavation completed.',
    newProgress: 5,
    daysAgoDate: 180,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'pm_alex',
    note: 'Piling work completed - 48 piles driven.',
    newProgress: 12,
    daysAgoDate: 150,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'foreman_marcus',
    note: 'Foundation pouring completed.',
    newProgress: 20,
    daysAgoDate: 120,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'foreman_marcus',
    note: 'Basement levels B1-B2 concrete work finished.',
    newProgress: 28,
    daysAgoDate: 90,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'pm_alex',
    note: 'Ground floor slab poured and cured.',
    newProgress: 32,
    daysAgoDate: 50,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'foreman_omar',
    note: 'Steel framing levels 1-3 erected.',
    newProgress: 35,
    daysAgoDate: 7,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'pm_rachel',
    note: 'All structural work completed up to floor 8.',
    newProgress: 60,
    daysAgoDate: 90,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'foreman_derek',
    note: 'MEP rough-in on floors 1-5.',
    newProgress: 68,
    daysAgoDate: 60,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'foreman_derek',
    note: 'Exterior facade 70% complete.',
    newProgress: 75,
    daysAgoDate: 30,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'pm_rachel',
    note: 'Interior finishing started.',
    newProgress: 78,
    daysAgoDate: 5,
  },
  {
    projectKey: 'buildco_bridge',
    userKey: 'pm_alex',
    note: 'Abutment construction completed.',
    newProgress: 25,
    daysAgoDate: 120,
  },
  {
    projectKey: 'buildco_bridge',
    userKey: 'foreman_omar',
    note: 'Steel girder erection started.',
    newProgress: 40,
    daysAgoDate: 60,
  },
  {
    projectKey: 'buildco_bridge',
    userKey: 'foreman_omar',
    note: 'Central span girders connected.',
    newProgress: 52,
    daysAgoDate: 10,
  },
  {
    projectKey: 'horizon_warehouse',
    userKey: 'pm_james',
    note: 'Racking system 50% complete.',
    newProgress: 40,
    daysAgoDate: 60,
  },
  {
    projectKey: 'horizon_warehouse',
    userKey: 'pm_james',
    note: 'Conveyor system operational.',
    newProgress: 55,
    daysAgoDate: 30,
  },
  {
    projectKey: 'horizon_warehouse',
    userKey: 'pm_james',
    note: 'Automated sorting installed.',
    newProgress: 65,
    daysAgoDate: 5,
  },
  {
    projectKey: 'urban_winter',
    userKey: 'sales_emma',
    note: 'Supplier orders placed.',
    newProgress: 30,
    daysAgoDate: 60,
  },
  {
    projectKey: 'urban_winter',
    userKey: 'sales_nina',
    note: 'Inventory received and QC done.',
    newProgress: 60,
    daysAgoDate: 30,
  },
  {
    projectKey: 'urban_winter',
    userKey: 'sales_nina',
    note: 'Store displays set up. Marketing launched.',
    newProgress: 90,
    daysAgoDate: 3,
  },
];
export async function seedProjects(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🏗️ Seeding Projects & Updates...');

  for (const p of PROJECTS) {
    const status = p.status || 'IN_PROGRESS';
    const startDate = p.startDaysAgo ? daysAgo(p.startDaysAgo) : null;
    const endDate =
      p.endDaysFromNow !== undefined && p.endDaysFromNow > 0
        ? daysAgo(-p.endDaysFromNow)
        : null;

    const project = await prisma.project.create({
      data: {
        companyId: ctx.companies[p.companyKey],
        name: p.name,
        code: p.code ?? null,
        description: `Seed project: ${p.name}`,
        status: status,
        progress: p.progress,
        budget: p.budget ?? null,
        startDate: startDate,
        endDate: endDate,
      },
    });

    ctx.projects[p.key] = project.id;
  }

  for (const u of PROJECT_UPDATES) {
    await prisma.projectUpdate.create({
      data: {
        projectId: ctx.projects[u.projectKey],
        userId: ctx.users[u.userKey],
        note: u.note,
        newProgress: u.newProgress,
        date: daysAgo(u.daysAgoDate),
      },
    });
  }

  console.log(
    `   ✅ Created ${PROJECTS.length} projects and ${PROJECT_UPDATES.length} updates`,
  );
}

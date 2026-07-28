import { PrismaClient } from '@prisma/client';
import { SeedContext, daysAgo } from './utils';

interface ProjectData {
  key: string;
  companyKey: string;
  name: string;
  progress: number;
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
    progress: 35.0,
  },
  {
    key: 'buildco_residential',
    companyKey: 'buildco',
    name: 'Westside Residential Complex',
    progress: 78.5,
  },
  {
    key: 'buildco_bridge',
    companyKey: 'buildco',
    name: 'Highway 101 Bridge Replacement',
    progress: 52.0,
  },
  {
    key: 'buildco_mall',
    companyKey: 'buildco',
    name: 'Riverside Shopping Mall Extension',
    progress: 15.0,
  },
  {
    key: 'horizon_warehouse',
    companyKey: 'horizon',
    name: 'Central Distribution Hub Build-out',
    progress: 65.0,
  },
  {
    key: 'horizon_coldchain',
    companyKey: 'horizon',
    name: 'Cold Chain Infrastructure Upgrade',
    progress: 40.0,
  },
  {
    key: 'horizon_fleet',
    companyKey: 'horizon',
    name: 'Electric Fleet Transition',
    progress: 25.0,
  },
  {
    key: 'green_irrigation',
    companyKey: 'greenvalley',
    name: 'Smart Irrigation System Installation',
    progress: 80.0,
  },
  {
    key: 'green_greenhouse',
    companyKey: 'greenvalley',
    name: 'Year-Round Greenhouse Complex',
    progress: 45.0,
  },
  {
    key: 'urban_winter',
    companyKey: 'urban_threads',
    name: 'Winter Collection Launch',
    progress: 90.0,
  },
  {
    key: 'urban_ecommerce',
    companyKey: 'urban_threads',
    name: 'E-Commerce Platform Setup',
    progress: 60.0,
  },
  {
    key: 'techmfg_pcb',
    companyKey: 'tech_mfg',
    name: 'PCB Assembly Line Expansion',
    progress: 70.0,
  },
  {
    key: 'techmfg_iso',
    companyKey: 'tech_mfg',
    name: 'ISO 9001 Certification',
    progress: 35.0,
  },
];

const PROJECT_UPDATES: ProjectUpdateData[] = [
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'pm_alex',
    note: 'Site clearing and foundation excavation completed.',
    newProgress: 5.0,
    daysAgoDate: 180,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'pm_alex',
    note: 'Piling work completed - 48 piles driven to bedrock.',
    newProgress: 12.0,
    daysAgoDate: 150,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'foreman_marcus',
    note: 'Foundation pouring completed across all 4 sections.',
    newProgress: 20.0,
    daysAgoDate: 120,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'foreman_marcus',
    note: 'Basement levels B1-B2 concrete work finished.',
    newProgress: 25.0,
    daysAgoDate: 90,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'pm_alex',
    note: 'Ground floor slab poured and cured.',
    newProgress: 30.0,
    daysAgoDate: 50,
  },
  {
    projectKey: 'buildco_skyscraper',
    userKey: 'foreman_omar',
    note: 'Steel framing levels 1-3 erected. Crane repositioned.',
    newProgress: 35.0,
    daysAgoDate: 7,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'pm_rachel',
    note: 'All structural work completed up to floor 8.',
    newProgress: 60.0,
    daysAgoDate: 90,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'foreman_derek',
    note: 'MEP rough-in progressing on floors 1-5.',
    newProgress: 68.0,
    daysAgoDate: 60,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'foreman_derek',
    note: 'Exterior facade installation 70% complete.',
    newProgress: 75.0,
    daysAgoDate: 30,
  },
  {
    projectKey: 'buildco_residential',
    userKey: 'pm_rachel',
    note: 'Interior finishing started on lower floors. Show units ready.',
    newProgress: 78.5,
    daysAgoDate: 5,
  },
  {
    projectKey: 'buildco_bridge',
    userKey: 'pm_alex',
    note: 'Abutment construction completed on both sides.',
    newProgress: 25.0,
    daysAgoDate: 120,
  },
  {
    projectKey: 'buildco_bridge',
    userKey: 'foreman_omar',
    note: 'Steel girder erection started from north side.',
    newProgress: 40.0,
    daysAgoDate: 60,
  },
  {
    projectKey: 'buildco_bridge',
    userKey: 'foreman_omar',
    note: 'Central span girders connected. Deck forming in progress.',
    newProgress: 52.0,
    daysAgoDate: 10,
  },
  {
    projectKey: 'horizon_warehouse',
    userKey: 'pm_james',
    note: 'Racking system installation 50% complete.',
    newProgress: 40.0,
    daysAgoDate: 60,
  },
  {
    projectKey: 'horizon_warehouse',
    userKey: 'pm_james',
    note: 'Conveyor system operational in Zone A.',
    newProgress: 55.0,
    daysAgoDate: 30,
  },
  {
    projectKey: 'horizon_warehouse',
    userKey: 'pm_james',
    note: 'Automated sorting system installed in Zones A-B.',
    newProgress: 65.0,
    daysAgoDate: 5,
  },
  {
    projectKey: 'urban_winter',
    userKey: 'sales_emma',
    note: 'Supplier orders placed for all SKUs.',
    newProgress: 30.0,
    daysAgoDate: 60,
  },
  {
    projectKey: 'urban_winter',
    userKey: 'sales_nina',
    note: 'Inventory received and quality checked.',
    newProgress: 60.0,
    daysAgoDate: 30,
  },
  {
    projectKey: 'urban_winter',
    userKey: 'sales_nina',
    note: 'Store displays set up. Marketing campaign launched.',
    newProgress: 90.0,
    daysAgoDate: 3,
  },
];

export async function seedProjects(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🏗️ Seeding Projects & Updates...');

  for (const project of PROJECTS) {
    const created = await prisma.project.create({
      data: {
        companyId: ctx.companies[project.companyKey],
        name: project.name,
        progress: project.progress,
      },
    });
    ctx.projects[project.key] = created.id;
  }

  await prisma.projectUpdate.createMany({
    data: PROJECT_UPDATES.map((u) => ({
      projectId: ctx.projects[u.projectKey],
      userId: ctx.users[u.userKey],
      note: u.note,
      newProgress: u.newProgress,
      date: daysAgo(u.daysAgoDate),
    })),
  });

  console.log(
    `   ✅ Created ${PROJECTS.length} projects and ${PROJECT_UPDATES.length} updates`,
  );
}

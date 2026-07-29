import { PrismaClient } from '@prisma/client';
import { SeedContext } from './utils';

interface EmployeeData {
  key: string;
  companyKey: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string;
  employmentType: string;
  hourlyRate?: number;
  dailyRate?: number;
  baseSalary?: number;
}

const EMPLOYEES: EmployeeData[] = [
  {
    key: 'buildco_carlos',
    companyKey: 'buildco',
    employeeCode: 'EMP-001',
    firstName: 'Carlos',
    lastName: 'Ruiz',
    designation: 'Site Supervisor',
    employmentType: 'FULL_TIME',
    baseSalary: 4200,
  },
  {
    key: 'buildco_liam',
    companyKey: 'buildco',
    employeeCode: 'EMP-002',
    firstName: 'Liam',
    lastName: "O'Connor",
    designation: 'Laborer',
    employmentType: 'DAILY_LABORER',
    dailyRate: 65,
  },
  {
    key: 'buildco_yusuf',
    companyKey: 'buildco',
    employeeCode: 'EMP-003',
    firstName: 'Yusuf',
    lastName: 'Ahmed',
    designation: 'Laborer',
    employmentType: 'DAILY_LABORER',
    dailyRate: 70,
  },
  {
    key: 'buildco_miguel',
    companyKey: 'buildco',
    employeeCode: 'EMP-004',
    firstName: 'Miguel',
    lastName: 'Santos',
    designation: 'Operator',
    employmentType: 'DAILY_LABORER',
    dailyRate: 60,
  },
  {
    key: 'buildco_raj',
    companyKey: 'buildco',
    employeeCode: 'EMP-005',
    firstName: 'Raj',
    lastName: 'Patel',
    designation: 'Surveyor',
    employmentType: 'FULL_TIME',
    baseSalary: 3800,
  },
  {
    key: 'buildco_svetlana',
    companyKey: 'buildco',
    employeeCode: 'EMP-006',
    firstName: 'Svetlana',
    lastName: 'Ivanova',
    designation: 'Engineer',
    employmentType: 'FULL_TIME',
    baseSalary: 3500,
  },
  {
    key: 'buildco_james_o',
    companyKey: 'buildco',
    employeeCode: 'EMP-007',
    firstName: 'James',
    lastName: 'Okonkwo',
    designation: 'Laborer',
    employmentType: 'DAILY_LABORER',
    dailyRate: 75,
  },
  {
    key: 'buildco_chen_wei',
    companyKey: 'buildco',
    employeeCode: 'EMP-008',
    firstName: 'Chen',
    lastName: 'Wei',
    designation: 'Laborer',
    employmentType: 'DAILY_LABORER',
    dailyRate: 65,
  },
  {
    key: 'buildco_marie',
    companyKey: 'buildco',
    employeeCode: 'EMP-009',
    firstName: 'Marie',
    lastName: 'Dupont',
    designation: 'Architect',
    employmentType: 'FULL_TIME',
    baseSalary: 4500,
  },
  {
    key: 'buildco_tony',
    companyKey: 'buildco',
    employeeCode: 'EMP-010',
    firstName: 'Tony',
    lastName: 'Moretti',
    designation: 'Foreman',
    employmentType: 'DAILY_LABORER',
    dailyRate: 80,
  },
  {
    key: 'buildco_anh',
    companyKey: 'buildco',
    employeeCode: 'EMP-011',
    firstName: 'Anh',
    lastName: 'Nguyen',
    designation: 'Laborer',
    employmentType: 'DAILY_LABORER',
    dailyRate: 60,
  },
  {
    key: 'horizon_mark',
    companyKey: 'horizon',
    employeeCode: 'EMP-012',
    firstName: 'Mark',
    lastName: 'Johnson',
    designation: 'Warehouse Manager',
    employmentType: 'FULL_TIME',
    baseSalary: 5500,
  },
  {
    key: 'horizon_linda',
    companyKey: 'horizon',
    employeeCode: 'EMP-013',
    firstName: 'Linda',
    lastName: 'Chen',
    designation: 'Logistics Coordinator',
    employmentType: 'FULL_TIME',
    baseSalary: 4200,
  },
  {
    key: 'horizon_robert',
    companyKey: 'horizon',
    employeeCode: 'EMP-014',
    firstName: 'Robert',
    lastName: 'Williams',
    designation: 'Dispatcher',
    employmentType: 'FULL_TIME',
    baseSalary: 3800,
  },
  {
    key: 'horizon_patricia',
    companyKey: 'horizon',
    employeeCode: 'EMP-015',
    firstName: 'Patricia',
    lastName: 'Garcia',
    designation: 'Admin',
    employmentType: 'FULL_TIME',
    baseSalary: 3500,
  },
  {
    key: 'green_pedro',
    companyKey: 'greenvalley',
    employeeCode: 'EMP-016',
    firstName: 'Pedro',
    lastName: 'Gonzalez',
    designation: 'Farm Manager',
    employmentType: 'FULL_TIME',
    baseSalary: 3200,
  },
  {
    key: 'green_elena',
    companyKey: 'greenvalley',
    employeeCode: 'EMP-017',
    firstName: 'Elena',
    lastName: 'Kowalczyk',
    designation: 'Field Worker',
    employmentType: 'FULL_TIME',
    baseSalary: 2800,
  },
  {
    key: 'green_jamal',
    companyKey: 'greenvalley',
    employeeCode: 'EMP-018',
    firstName: 'Jamal',
    lastName: 'Hassan',
    designation: 'Laborer',
    employmentType: 'DAILY_LABORER',
    dailyRate: 55,
  },
  {
    key: 'green_maria_f',
    companyKey: 'greenvalley',
    employeeCode: 'EMP-019',
    firstName: 'Maria',
    lastName: 'Fernandez',
    designation: 'Laborer',
    employmentType: 'DAILY_LABORER',
    dailyRate: 50,
  },
  {
    key: 'urban_sophie',
    companyKey: 'urban_threads',
    employeeCode: 'EMP-020',
    firstName: 'Sophie',
    lastName: 'Martin',
    designation: 'Retail Manager',
    employmentType: 'FULL_TIME',
    baseSalary: 3200,
  },
  {
    key: 'urban_olivia',
    companyKey: 'urban_threads',
    employeeCode: 'EMP-021',
    firstName: 'Olivia',
    lastName: 'Park',
    designation: 'Sales Associate',
    employmentType: 'FULL_TIME',
    baseSalary: 2400,
  },
  {
    key: 'techmfg_dr_zhang',
    companyKey: 'tech_mfg',
    employeeCode: 'EMP-022',
    firstName: 'Wei',
    lastName: 'Zhang',
    designation: 'Chief Engineer',
    employmentType: 'FULL_TIME',
    baseSalary: 8500,
  },
  {
    key: 'techmfg_priya',
    companyKey: 'tech_mfg',
    employeeCode: 'EMP-023',
    firstName: 'Priya',
    lastName: 'Sharma',
    designation: 'Production Supervisor',
    employmentType: 'FULL_TIME',
    baseSalary: 5500,
  },
  {
    key: 'techmfg_tommy',
    companyKey: 'tech_mfg',
    employeeCode: 'EMP-024',
    firstName: 'Tommy',
    lastName: 'Lim',
    designation: 'Technician',
    employmentType: 'FULL_TIME',
    baseSalary: 4000,
  },
];

// prisma/seed/07-employees.ts

export async function seedEmployees(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('👷 Seeding Employees...');

  for (const e of EMPLOYEES) {
    const companyId = ctx.companies[e.companyKey];
    if (!companyId) {
      throw new Error(
        `Company key '${e.companyKey}' not found in ctx.companies`,
      );
    }

    const hourlyRate = e.hourlyRate ?? null;
    const dailyRate = e.dailyRate ?? null;
    const baseSalary = e.baseSalary ?? null;

    // Use $executeRaw (tagged template) instead of $executeRawUnsafe
    await prisma.$executeRaw`
      INSERT INTO finsync.employees (
        "companyId",
        "employeeCode",
        "firstName",
        "lastName",
        email,
        phone,
        designation,
        "employmentType",
        "baseSalary",
        "hourlyRate",
        "dailyRate",
        "isActive",
        "joinedDate",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${companyId},
        ${e.employeeCode},
        ${e.firstName},
        ${e.lastName},
        NULL,
        NULL,
        ${e.designation},
        ${e.employmentType},
        ${baseSalary},
        ${hourlyRate},
        ${dailyRate},
        true,
        NOW(),
        NOW(),
        NOW()
      );
    `;

    const rows: any[] = await prisma.$queryRaw`
      SELECT id FROM finsync.employees ORDER BY id DESC LIMIT 1;
    `;

    if (rows.length > 0) {
      ctx.employees[e.key] = rows[0].id;
    }
  }

  console.log(`   ✅ Created ${EMPLOYEES.length} employees`);
}

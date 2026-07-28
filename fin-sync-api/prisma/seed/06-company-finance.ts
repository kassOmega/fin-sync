import { PrismaClient } from '@prisma/client';
import { SeedContext, daysAgo, randomBetween, randomItem } from './utils';

interface ExpenseCategoryConfig {
  category: string;
  minAmount: number;
  maxAmount: number;
  frequency: number;
  notes: string[];
}

interface IncomeCategoryConfig {
  category: string;
  minAmount: number;
  maxAmount: number;
  frequency: number;
  notes: string[];
}

const BUILDCO_EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  {
    category: 'Fuel',
    minAmount: 150,
    maxAmount: 800,
    frequency: 0.7,
    notes: [
      'Diesel for heavy equipment',
      'Generator fuel',
      'Vehicle refueling',
    ],
  },
  {
    category: 'Salary',
    minAmount: 5000,
    maxAmount: 45000,
    frequency: 0.033,
    notes: ['Monthly payroll', 'Weekly wage disbursement', 'Overtime payment'],
  },
  {
    category: 'Materials - Cement',
    minAmount: 2000,
    maxAmount: 15000,
    frequency: 0.15,
    notes: [
      'Portland cement delivery',
      'Bulk cement order',
      'Specialty cement',
    ],
  },
  {
    category: 'Materials - Steel',
    minAmount: 5000,
    maxAmount: 25000,
    frequency: 0.1,
    notes: ['Rebar delivery', 'Structural steel order', 'Wire mesh'],
  },
  {
    category: 'Materials - Aggregates',
    minAmount: 800,
    maxAmount: 5000,
    frequency: 0.12,
    notes: ['Sand delivery', 'Gravel order', 'Crushed stone'],
  },
  {
    category: 'Rent',
    minAmount: 3000,
    maxAmount: 8000,
    frequency: 0.033,
    notes: ['Office rent', 'Equipment yard rent', 'Site office rental'],
  },
  {
    category: 'Utilities',
    minAmount: 500,
    maxAmount: 2500,
    frequency: 0.1,
    notes: ['Electricity bill', 'Water bill', 'Internet & phone'],
  },
  {
    category: 'Maintenance',
    minAmount: 200,
    maxAmount: 5000,
    frequency: 0.05,
    notes: ['Equipment repair', 'Vehicle servicing', 'Tool replacement'],
  },
  {
    category: 'Safety Equipment',
    minAmount: 100,
    maxAmount: 2000,
    frequency: 0.04,
    notes: ['PPE purchase', 'Safety gear replacement', 'First aid supplies'],
  },
  {
    category: 'Subcontractor',
    minAmount: 5000,
    maxAmount: 50000,
    frequency: 0.05,
    notes: ['Electrical subcontractor', 'Plumbing work', 'HVAC installation'],
  },
  {
    category: 'Permits & Fees',
    minAmount: 200,
    maxAmount: 5000,
    frequency: 0.02,
    notes: ['Building permit', 'Inspection fee', 'Environmental fee'],
  },
  {
    category: 'Insurance',
    minAmount: 2000,
    maxAmount: 8000,
    frequency: 0.033,
    notes: [
      'Liability insurance premium',
      'Workers comp',
      'Equipment insurance',
    ],
  },
  {
    category: 'Transportation',
    minAmount: 300,
    maxAmount: 3000,
    frequency: 0.08,
    notes: ['Material delivery charge', 'Equipment transport', 'Waste removal'],
  },
  {
    category: 'Misc',
    minAmount: 50,
    maxAmount: 500,
    frequency: 0.15,
    notes: ['Office supplies', 'Minor purchases', 'Incidental expenses'],
  },
];

const BUILDCO_INCOME_CATEGORIES: IncomeCategoryConfig[] = [
  {
    category: 'Client Milestone Payment',
    minAmount: 50000,
    maxAmount: 300000,
    frequency: 0.02,
    notes: [
      'Milestone 1 completion',
      'Milestone 2 completion',
      'Phase completion',
    ],
  },
  {
    category: 'Progress Billing',
    minAmount: 10000,
    maxAmount: 75000,
    frequency: 0.08,
    notes: [
      'Monthly progress claim',
      'Bi-weekly progress',
      'Retained portion release',
    ],
  },
  {
    category: 'Variation Order',
    minAmount: 2000,
    maxAmount: 25000,
    frequency: 0.02,
    notes: ['Scope change #1', 'Additional work', 'Design change'],
  },
  {
    category: 'Equipment Rental Income',
    minAmount: 500,
    maxAmount: 5000,
    frequency: 0.03,
    notes: ['Crane rental to third party', 'Equipment idle time rental'],
  },
  {
    category: 'Material Sale',
    minAmount: 500,
    maxAmount: 10000,
    frequency: 0.01,
    notes: ['Surplus material sale', 'Scrap metal sale'],
  },
];

const HORIZON_EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  {
    category: 'Fuel',
    minAmount: 2000,
    maxAmount: 8000,
    frequency: 0.8,
    notes: ['Fleet diesel', 'Gasoline for vans', 'Generator fuel'],
  },
  {
    category: 'Salary',
    minAmount: 8000,
    maxAmount: 35000,
    frequency: 0.033,
    notes: ['Driver payroll', 'Warehouse staff salary', 'Management salary'],
  },
  {
    category: 'Maintenance',
    minAmount: 500,
    maxAmount: 8000,
    frequency: 0.1,
    notes: ['Truck service', 'Tire replacement', 'Brake repair'],
  },
  {
    category: 'Insurance',
    minAmount: 3000,
    maxAmount: 10000,
    frequency: 0.033,
    notes: ['Fleet insurance', 'Cargo insurance', 'Liability insurance'],
  },
  {
    category: 'Tolls & Permits',
    minAmount: 200,
    maxAmount: 1500,
    frequency: 0.3,
    notes: ['Highway tolls', 'Overweight permit', 'Hazmat permit'],
  },
  {
    category: 'Warehouse Rent',
    minAmount: 5000,
    maxAmount: 12000,
    frequency: 0.033,
    notes: ['Warehouse lease', 'Cold storage rental'],
  },
  {
    category: 'Utilities',
    minAmount: 1000,
    maxAmount: 4000,
    frequency: 0.1,
    notes: ['Warehouse electricity', 'Office utilities'],
  },
  {
    category: 'Packing Materials',
    minAmount: 300,
    maxAmount: 3000,
    frequency: 0.15,
    notes: ['Pallets', 'Shrink wrap', 'Boxes', 'Strapping'],
  },
];

const HORIZON_INCOME_CATEGORIES: IncomeCategoryConfig[] = [
  {
    category: 'Freight Charges',
    minAmount: 2000,
    maxAmount: 15000,
    frequency: 0.4,
    notes: ['LTL shipment', 'FTL delivery', 'Express delivery'],
  },
  {
    category: 'Warehousing Fees',
    minAmount: 1000,
    maxAmount: 8000,
    frequency: 0.15,
    notes: ['Storage fees', 'Handling charges', 'Pick & pack'],
  },
  {
    category: 'Last Mile Delivery',
    minAmount: 50,
    maxAmount: 500,
    frequency: 0.5,
    notes: ['Local delivery', 'Same-day delivery', 'Scheduled delivery'],
  },
  {
    category: 'Cold Chain Premium',
    minAmount: 500,
    maxAmount: 3000,
    frequency: 0.1,
    notes: ['Temperature-controlled shipment', 'Pharmaceutical delivery'],
  },
  {
    category: 'Contract Payment',
    minAmount: 20000,
    maxAmount: 100000,
    frequency: 0.02,
    notes: ['Monthly contract invoice', 'Annual contract payment'],
  },
];

const GREENVALLEY_EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  {
    category: 'Seeds & Seedlings',
    minAmount: 200,
    maxAmount: 3000,
    frequency: 0.05,
    notes: ['Crop seeds', 'Vegetable seedlings', 'Flower seeds'],
  },
  {
    category: 'Fertilizers',
    minAmount: 500,
    maxAmount: 5000,
    frequency: 0.08,
    notes: ['NPK fertilizer', 'Organic compost', 'Micronutrients'],
  },
  {
    category: 'Pesticides',
    minAmount: 100,
    maxAmount: 2000,
    frequency: 0.06,
    notes: ['Herbicide', 'Insecticide', 'Fungicide'],
  },
  {
    category: 'Fuel',
    minAmount: 200,
    maxAmount: 1000,
    frequency: 0.5,
    notes: ['Tractor diesel', 'Vehicle fuel'],
  },
  {
    category: 'Labor',
    minAmount: 2000,
    maxAmount: 8000,
    frequency: 0.033,
    notes: ['Farm worker wages', 'Seasonal labor', 'Harvest crew'],
  },
  {
    category: 'Equipment Maintenance',
    minAmount: 300,
    maxAmount: 4000,
    frequency: 0.05,
    notes: ['Tractor service', 'Irrigation repair', 'Fence repair'],
  },
  {
    category: 'Water & Irrigation',
    minAmount: 100,
    maxAmount: 800,
    frequency: 0.2,
    notes: ['Water bill', 'Irrigation system operation'],
  },
  {
    category: 'Veterinary',
    minAmount: 100,
    maxAmount: 1500,
    frequency: 0.03,
    notes: ['Livestock checkup', 'Vaccinations', 'Medication'],
  },
  {
    category: 'Feed & Supplies',
    minAmount: 500,
    maxAmount: 3000,
    frequency: 0.15,
    notes: ['Animal feed', 'Bedding', 'Supplements'],
  },
];

const GREENVALLEY_INCOME_CATEGORIES: IncomeCategoryConfig[] = [
  {
    category: 'Crop Sales',
    minAmount: 2000,
    maxAmount: 20000,
    frequency: 0.08,
    notes: ['Wheat harvest sale', 'Corn delivery', 'Vegetable batch'],
  },
  {
    category: 'Dairy Sales',
    minAmount: 500,
    maxAmount: 5000,
    frequency: 0.2,
    notes: ['Milk delivery', 'Cheese sales', 'Yogurt orders'],
  },
  {
    category: 'Poultry Sales',
    minAmount: 300,
    maxAmount: 3000,
    frequency: 0.15,
    notes: ['Egg delivery', 'Chicken batch', 'Turkey orders'],
  },
  {
    category: 'Farm Stand Sales',
    minAmount: 50,
    maxAmount: 500,
    frequency: 0.4,
    notes: ['Daily farm stand', 'Weekend market'],
  },
  {
    category: 'CSA Subscriptions',
    minAmount: 1000,
    maxAmount: 5000,
    frequency: 0.1,
    notes: ['Monthly CSA boxes', 'Seasonal subscription'],
  },
  {
    category: 'Government Subsidy',
    minAmount: 5000,
    maxAmount: 50000,
    frequency: 0.01,
    notes: ['Crop insurance payment', 'Conservation grant'],
  },
];

const TECHMFG_EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  {
    category: 'Raw Materials - PCB',
    minAmount: 5000,
    maxAmount: 50000,
    frequency: 0.1,
    notes: ['Bare PCB order', 'Copper clad laminate', 'Prepreg'],
  },
  {
    category: 'Components - ICs',
    minAmount: 10000,
    maxAmount: 100000,
    frequency: 0.05,
    notes: ['Microcontroller order', 'Memory chips', 'Power ICs'],
  },
  {
    category: 'Components - Passive',
    minAmount: 1000,
    maxAmount: 10000,
    frequency: 0.15,
    notes: ['Resistors & capacitors', 'Connectors', 'Inductors'],
  },
  {
    category: 'Solder Paste & Consumables',
    minAmount: 200,
    maxAmount: 2000,
    frequency: 0.2,
    notes: ['Solder paste', 'Flux', 'Cleaning chemicals'],
  },
  {
    category: 'Electricity',
    minAmount: 3000,
    maxAmount: 8000,
    frequency: 0.1,
    notes: ['Factory power bill', 'HVAC costs'],
  },
  {
    category: 'Salary',
    minAmount: 15000,
    maxAmount: 80000,
    frequency: 0.033,
    notes: ['Engineering staff', 'Technicians', 'Management'],
  },
  {
    category: 'Equipment Maintenance',
    minAmount: 1000,
    maxAmount: 15000,
    frequency: 0.03,
    notes: ['SMT line calibration', 'Nozzle replacement'],
  },
  {
    category: 'Quality Control',
    minAmount: 500,
    maxAmount: 5000,
    frequency: 0.05,
    notes: ['X-ray inspection', 'Lab testing', 'Certification'],
  },
  {
    category: 'Packaging & Shipping',
    minAmount: 300,
    maxAmount: 3000,
    frequency: 0.2,
    notes: ['ESD bags', 'Shipping boxes', 'Freight charges'],
  },
];

const TECHMFG_INCOME_CATEGORIES: IncomeCategoryConfig[] = [
  {
    category: 'PCB Assembly Order',
    minAmount: 10000,
    maxAmount: 200000,
    frequency: 0.05,
    notes: ['Batch assembly #1', 'Prototype run', 'Production order'],
  },
  {
    category: 'NRE Charges',
    minAmount: 2000,
    maxAmount: 20000,
    frequency: 0.02,
    notes: ['Design review fee', 'Fixture development', 'Programming'],
  },
  {
    category: 'Excess Inventory Sale',
    minAmount: 500,
    maxAmount: 5000,
    frequency: 0.03,
    notes: ['Component surplus sale', 'Scrap recovery'],
  },
  {
    category: 'Consulting Services',
    minAmount: 1000,
    maxAmount: 10000,
    frequency: 0.02,
    notes: ['DFM review', 'Process optimization', 'Training'],
  },
];

interface CompanyFinanceConfig {
  companyKey: string;
  registeredByKeys: string[];
  expenseCategories: ExpenseCategoryConfig[];
  incomeCategories: IncomeCategoryConfig[];
  daysToGenerate: number;
  projectKeys?: string[];
  machineryKeys?: string[];
}

const COMPANY_FINANCES: CompanyFinanceConfig[] = [
  {
    companyKey: 'buildco',
    registeredByKeys: ['cashier_jane', 'owner_john', 'pm_alex'],
    expenseCategories: BUILDCO_EXPENSE_CATEGORIES,
    incomeCategories: BUILDCO_INCOME_CATEGORIES,
    daysToGenerate: 180,
    projectKeys: [
      'buildco_skyscraper',
      'buildco_residential',
      'buildco_bridge',
      'buildco_mall',
    ],
    machineryKeys: [
      'buildco_excavator_1',
      'buildco_crane_1',
      'buildco_mixer_1',
    ],
  },
  {
    companyKey: 'horizon',
    registeredByKeys: ['cashier_tom', 'owner_sarah', 'pm_james'],
    expenseCategories: HORIZON_EXPENSE_CATEGORIES,
    incomeCategories: HORIZON_INCOME_CATEGORIES,
    daysToGenerate: 180,
    machineryKeys: ['horizon_truck_1', 'horizon_truck_2', 'horizon_van_1'],
  },
  {
    companyKey: 'greenvalley',
    registeredByKeys: ['store_chris', 'owner_mike'],
    expenseCategories: GREENVALLEY_EXPENSE_CATEGORIES,
    incomeCategories: GREENVALLEY_INCOME_CATEGORIES,
    daysToGenerate: 180,
    machineryKeys: ['green_tractor_1', 'green_harvester'],
  },
  {
    companyKey: 'tech_mfg',
    registeredByKeys: ['cashier_jane', 'sales_jake', 'owner_ahmed'],
    expenseCategories: TECHMFG_EXPENSE_CATEGORIES,
    incomeCategories: TECHMFG_INCOME_CATEGORIES,
    daysToGenerate: 180,
    projectKeys: ['techmfg_pcb', 'techmfg_iso'],
    machineryKeys: ['techmfg_smt_1', 'techmfg_smt_2'],
  },
];

export async function seedCompanyFinance(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('💳 Seeding Company Financial Records...');

  const allExpenses: any[] = [];
  const allIncomes: any[] = [];

  for (const config of COMPANY_FINANCES) {
    const companyId = ctx.companies[config.companyKey];
    const registeredByIds = config.registeredByKeys.map((k) => ctx.users[k]);
    const projectIds = config.projectKeys?.map((k) => ctx.projects[k]) || [];
    const machineryIds =
      config.machineryKeys?.map((k) => ctx.machinery[k]) || [];

    for (let day = 0; day < config.daysToGenerate; day++) {
      const date = daysAgo(day);

      for (const cat of config.expenseCategories) {
        if (Math.random() < cat.frequency) {
          const data: any = {
            companyId,
            registeredBy: randomItem(registeredByIds),
            amount: randomBetween(cat.minAmount, cat.maxAmount, 0),
            category: cat.category,
            note: randomItem(cat.notes),
            date,
            isRecurring: [
              'Salary',
              'Rent',
              'Insurance',
              'Warehouse Rent',
              'Electricity',
            ].includes(cat.category),
            recurringFrequency: [
              'Salary',
              'Rent',
              'Insurance',
              'Warehouse Rent',
              'Electricity',
            ].includes(cat.category)
              ? 'MONTHLY'
              : null,
          };
          if (projectIds.length > 0 && Math.random() > 0.7) {
            data.projectId = randomItem(projectIds);
          }
          if (
            machineryIds.length > 0 &&
            ['Fuel', 'Maintenance', 'Equipment Maintenance'].includes(
              cat.category,
            )
          ) {
            data.machineryId = randomItem(machineryIds);
          }
          allExpenses.push(data);
        }
      }

      for (const cat of config.incomeCategories) {
        if (Math.random() < cat.frequency) {
          const data: any = {
            companyId,
            registeredBy: randomItem(registeredByIds),
            amount: randomBetween(cat.minAmount, cat.maxAmount, 0),
            category: cat.category,
            note: randomItem(cat.notes),
            date,
          };
          if (projectIds.length > 0 && Math.random() > 0.5) {
            data.projectId = randomItem(projectIds);
          }
          if (
            machineryIds.length > 0 &&
            ['Equipment Rental Income'].includes(cat.category)
          ) {
            data.machineryId = randomItem(machineryIds);
          }
          allIncomes.push(data);
        }
      }
    }
  }

  const CHUNK_SIZE = 200;
  console.log(
    `   📊 Generating ${allExpenses.length} expenses and ${allIncomes.length} incomes...`,
  );

  for (let i = 0; i < allExpenses.length; i += CHUNK_SIZE) {
    await prisma.companyExpense.createMany({
      data: allExpenses.slice(i, i + CHUNK_SIZE),
    });
  }
  for (let i = 0; i < allIncomes.length; i += CHUNK_SIZE) {
    await prisma.companyIncome.createMany({
      data: allIncomes.slice(i, i + CHUNK_SIZE),
    });
  }

  console.log(
    `   ✅ Created ${allExpenses.length} expenses and ${allIncomes.length} incomes`,
  );
}

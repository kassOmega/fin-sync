import { PrismaClient, SystemRole } from '@prisma/client';
import { SeedContext, hashPassword } from './utils';

interface UserData {
  key: string;
  name: string;
  email: string;
  role: SystemRole;
  phone: string;
}

const USERS: UserData[] = [
  // Owners
  {
    key: 'owner_john',
    name: 'John Owner',
    email: 'john@finsync.com',
    role: SystemRole.Owner,
    phone: '+1-555-0100',
  },
  {
    key: 'owner_sarah',
    name: 'Sarah Jenkins',
    email: 'sarah@horizonlogistics.com',
    role: SystemRole.Owner,
    phone: '+1-555-0101',
  },
  {
    key: 'owner_mike',
    name: 'Mike Chen',
    email: 'mike@greenvalley.com',
    role: SystemRole.Owner,
    phone: '+1-555-0108',
  },
  {
    key: 'owner_lisa',
    name: 'Lisa Rodriguez',
    email: 'lisa@urbanthreads.com',
    role: SystemRole.Owner,
    phone: '+1-555-0109',
  },
  {
    key: 'owner_ahmed',
    name: 'Ahmed Hassan',
    email: 'ahmed@techmanufacture.com',
    role: SystemRole.Owner,
    phone: '+1-555-0110',
  },

  // Project Managers
  {
    key: 'pm_alex',
    name: 'Alex Vance',
    email: 'alex.pm@finsync.com',
    role: SystemRole.ProjectManager,
    phone: '+1-555-0200',
  },
  {
    key: 'pm_rachel',
    name: 'Rachel Kim',
    email: 'rachel.pm@finsync.com',
    role: SystemRole.ProjectManager,
    phone: '+1-555-0201',
  },
  {
    key: 'pm_james',
    name: 'James Wilson',
    email: 'james.pm@horizonlogistics.com',
    role: SystemRole.ProjectManager,
    phone: '+1-555-0202',
  },

  // Foremen
  {
    key: 'foreman_marcus',
    name: 'Marcus Brody',
    email: 'marcus.foreman@finsync.com',
    role: SystemRole.Foreman,
    phone: '+1-555-0300',
  },
  {
    key: 'foreman_omar',
    name: 'Omar Patel',
    email: 'omar.foreman@finsync.com',
    role: SystemRole.Foreman,
    phone: '+1-555-0301',
  },
  {
    key: 'foreman_derek',
    name: 'Derek Thompson',
    email: 'derek.foreman@finsync.com',
    role: SystemRole.Foreman,
    phone: '+1-555-0302',
  },

  // Storekeepers
  {
    key: 'store_bob',
    name: 'Bob Miller',
    email: 'bob.store@finsync.com',
    role: SystemRole.Storekeeper,
    phone: '+1-555-0400',
  },
  {
    key: 'store_anna',
    name: 'Anna Kowalski',
    email: 'anna.store@urbanthreads.com',
    role: SystemRole.Storekeeper,
    phone: '+1-555-0401',
  },
  {
    key: 'store_chris',
    name: 'Chris Lee',
    email: 'chris.store@greenvalley.com',
    role: SystemRole.Storekeeper,
    phone: '+1-555-0402',
  },

  // Cashiers
  {
    key: 'cashier_jane',
    name: 'Jane Cashier',
    email: 'jane.cashier@finsync.com',
    role: SystemRole.Cashier,
    phone: '+1-555-0500',
  },
  {
    key: 'cashier_maria',
    name: 'Maria Santos',
    email: 'maria.cashier@urbanthreads.com',
    role: SystemRole.Cashier,
    phone: '+1-555-0501',
  },
  {
    key: 'cashier_tom',
    name: 'Tom Baker',
    email: 'tom.cashier@horizonlogistics.com',
    role: SystemRole.Cashier,
    phone: '+1-555-0502',
  },

  // Operators/Drivers
  {
    key: 'op_david',
    name: 'David Heavy',
    email: 'david.op@finsync.com',
    role: SystemRole.OperatorDriver,
    phone: '+1-555-0600',
  },
  {
    key: 'op_kenji',
    name: 'Kenji Tanaka',
    email: 'kenji.op@finsync.com',
    role: SystemRole.OperatorDriver,
    phone: '+1-555-0601',
  },
  {
    key: 'driver_pete',
    name: 'Pete Rodriguez',
    email: 'pete.driver@horizonlogistics.com',
    role: SystemRole.OperatorDriver,
    phone: '+1-555-0602',
  },
  {
    key: 'driver_sam',
    name: 'Sam Wright',
    email: 'sam.driver@horizonlogistics.com',
    role: SystemRole.OperatorDriver,
    phone: '+1-555-0603',
  },
  {
    key: 'driver_rick',
    name: 'Rick Martinez',
    email: 'rick.driver@horizonlogistics.com',
    role: SystemRole.OperatorDriver,
    phone: '+1-555-0604',
  },
  {
    key: 'op_farm_1',
    name: 'Jose Fernandez',
    email: 'jose.op@greenvalley.com',
    role: SystemRole.OperatorDriver,
    phone: '+1-555-0605',
  },

  // Sales
  {
    key: 'sales_emma',
    name: 'Emma Stone',
    email: 'emma.sales@finsync.com',
    role: SystemRole.Sales,
    phone: '+1-555-0700',
  },
  {
    key: 'sales_nina',
    name: 'Nina Petrova',
    email: 'nina.sales@urbanthreads.com',
    role: SystemRole.Sales,
    phone: '+1-555-0701',
  },
  {
    key: 'sales_ryan',
    name: "Ryan O'Brien",
    email: 'ryan.sales@urbanthreads.com',
    role: SystemRole.Sales,
    phone: '+1-555-0702',
  },
  {
    key: 'sales_jake',
    name: 'Jake Morrison',
    email: 'jake.sales@techmanufacture.com',
    role: SystemRole.Sales,
    phone: '+1-555-0703',
  },
];

export async function seedUsers(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('👤 Seeding Users...');

  const hashedPassword = await hashPassword('password123');

  for (const user of USERS) {
    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        phone: user.phone,
      },
    });
    ctx.users[user.key] = created.id;
  }

  console.log(`   ✅ Created ${USERS.length} users`);
}

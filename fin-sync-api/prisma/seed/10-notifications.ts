import { PrismaClient } from '@prisma/client';
import { SeedContext, daysAgo } from './utils';

interface NotificationData {
  userKey: string;
  title: string;
  message: string;
  isRead: boolean;
  daysAgoDate?: number;
}

const NOTIFICATIONS: NotificationData[] = [
  {
    userKey: 'owner_john',
    title: '⚠️ Low Stock Alert',
    message:
      'Steel Rebar T12 quantity (18) is below threshold (30) for BuildCo.',
    isRead: false,
    daysAgoDate: 1,
  },
  {
    userKey: 'owner_john',
    title: '📅 Daily Wage Due',
    message: 'Payment due tomorrow for 8 daily laborers at BuildCo.',
    isRead: false,
    daysAgoDate: 0,
  },
  {
    userKey: 'owner_john',
    title: '💰 Large Income Received',
    message:
      'Client Milestone Payment of $150,000 received for Downtown Skyscraper.',
    isRead: true,
    daysAgoDate: 20,
  },
  {
    userKey: 'owner_john',
    title: '🔧 Equipment Maintenance',
    message: 'Liebherr Crane status updated to MAINTENANCE at BuildCo.',
    isRead: false,
    daysAgoDate: 2,
  },
  {
    userKey: 'owner_john',
    title: '📊 Monthly Report Ready',
    message: 'November financial report is ready for review.',
    isRead: true,
    daysAgoDate: 5,
  },
  {
    userKey: 'owner_john',
    title: '⚠️ Budget Overrun',
    message: 'Materials - Steel category exceeded monthly budget by 15%.',
    isRead: false,
    daysAgoDate: 3,
  },
  {
    userKey: 'owner_john',
    title: '🎉 Project Milestone',
    message: 'Westside Residential Complex reached 78% progress!',
    isRead: true,
    daysAgoDate: 5,
  },
  {
    userKey: 'owner_sarah',
    title: '🚛 Fleet Maintenance Due',
    message:
      'Scania R500 Semi-Truck #3 reached maintenance interval (120,000 hrs).',
    isRead: false,
    daysAgoDate: 1,
  },
  {
    userKey: 'owner_sarah',
    title: '💰 Contract Payment',
    message: 'Monthly contract invoice of $45,000 from LogiCorp has been paid.',
    isRead: true,
    daysAgoDate: 7,
  },
  {
    userKey: 'owner_mike',
    title: '🌾 Harvest Season Approaching',
    message:
      'Combine harvester is in MAINTENANCE. Schedule repair before harvest.',
    isRead: false,
    daysAgoDate: 5,
  },
  {
    userKey: 'owner_mike',
    title: '💧 Irrigation Update',
    message: 'Smart Irrigation System project reached 80% completion.',
    isRead: true,
    daysAgoDate: 10,
  },
  {
    userKey: 'owner_lisa',
    title: '🛍️ Sales Spike',
    message: 'Winter Collection sales up 45% compared to last month!',
    isRead: true,
    daysAgoDate: 2,
  },
  {
    userKey: 'owner_lisa',
    title: '📦 New Store Request',
    message: 'Emma requested 15 Cashmere Sweaters - stock running low.',
    isRead: false,
    daysAgoDate: 0,
  },
  {
    userKey: 'pm_alex',
    title: '🔧 Equipment Maintenance Needed',
    message:
      'Liebherr Crane status updated to MAINTENANCE. Arrange alternative lifting.',
    isRead: false,
    daysAgoDate: 2,
  },
  {
    userKey: 'pm_alex',
    title: '📋 New Store Request',
    message: 'Marcus Brody requested 40 Steel Rebar T12 for skyscraper.',
    isRead: true,
    daysAgoDate: 3,
  },
  {
    userKey: 'pm_alex',
    title: '⚠️ Schedule Alert',
    message:
      'Bridge project falling behind by 3 days. Review resource allocation.',
    isRead: false,
    daysAgoDate: 1,
  },
  {
    userKey: 'pm_rachel',
    title: '🎉 Progress Milestone',
    message: 'Westside Residential Complex reached 78% progress!',
    isRead: true,
    daysAgoDate: 5,
  },
  {
    userKey: 'foreman_marcus',
    title: '✅ Request Approved',
    message: 'Your request for 60 bags cement has been approved.',
    isRead: true,
    daysAgoDate: 15,
  },
  {
    userKey: 'foreman_marcus',
    title: '⚠️ Safety Reminder',
    message: 'Monthly safety inspection scheduled for tomorrow.',
    isRead: false,
    daysAgoDate: 0,
  },
  {
    userKey: 'foreman_marcus',
    title: '📋 Pending Request',
    message: 'Your request for 40 Steel Rebar T12 is still pending approval.',
    isRead: false,
    daysAgoDate: 3,
  },
  {
    userKey: 'store_bob',
    title: '📦 New Store Request',
    message: 'Marcus Brody requested 40 Steel Rebar T12.',
    isRead: true,
    daysAgoDate: 3,
  },
  {
    userKey: 'store_bob',
    title: '⚠️ Low Stock Alert',
    message: 'Multiple items below threshold. Review inventory report.',
    isRead: false,
    daysAgoDate: 1,
  },
  {
    userKey: 'store_bob',
    title: '✅ Restock Completed',
    message: 'Cement restock of 300 bags received and counted.',
    isRead: true,
    daysAgoDate: 30,
  },
  {
    userKey: 'store_anna',
    title: '📦 New Store Request',
    message: 'Emma requested 15 Cashmere Sweaters.',
    isRead: false,
    daysAgoDate: 0,
  },
  {
    userKey: 'store_anna',
    title: '✅ Restock Received',
    message: 'Premium Fabrics order ($650) delivered.',
    isRead: true,
    daysAgoDate: 10,
  },
  {
    userKey: 'store_anna',
    title: '❌ Request Rejected',
    message:
      'Nina request for 10 White Sneakers was rejected - budget constraint.',
    isRead: true,
    daysAgoDate: 5,
  },
  {
    userKey: 'cashier_jane',
    title: '💰 Expense Approved',
    message: 'Your fuel expense of $450 has been recorded.',
    isRead: true,
    daysAgoDate: 2,
  },
  {
    userKey: 'sales_emma',
    title: '🎉 Big Sale!',
    message: 'You completed a $389.97 sale to Michael Chen!',
    isRead: true,
    daysAgoDate: 7,
  },
  {
    userKey: 'sales_emma',
    title: '📋 Pending Request',
    message: 'Your request for 15 Cashmere Sweaters is pending.',
    isRead: false,
    daysAgoDate: 0,
  },
  {
    userKey: 'sales_emma',
    title: '📊 Sales Target',
    message: 'You are at 85% of your monthly sales target. Keep it up!',
    isRead: false,
    daysAgoDate: 1,
  },
  {
    userKey: 'op_david',
    title: '🔧 Maintenance Scheduled',
    message: 'CAT 320 Excavator due for 100-hour service.',
    isRead: false,
    daysAgoDate: 1,
  },
  {
    userKey: 'op_david',
    title: '📋 Material Issued',
    message: '50 bags cement issued to you for foundation work.',
    isRead: true,
    daysAgoDate: 20,
  },
  {
    userKey: 'driver_pete',
    title: '🚛 New Assignment',
    message: 'Long-haul delivery to Chicago - depart 6 AM tomorrow.',
    isRead: false,
    daysAgoDate: 0,
  },
  {
    userKey: 'driver_pete',
    title: '⛽ Fuel Issued',
    message: '500L diesel issued for Truck #1 refueling.',
    isRead: true,
    daysAgoDate: 3,
  },
  {
    userKey: 'owner_ahmed',
    title: '🏭 Production Update',
    message: 'PCB Assembly Line #1 operating at 92% efficiency.',
    isRead: true,
    daysAgoDate: 5,
  },
  {
    userKey: 'owner_ahmed',
    title: '📋 ISO Audit',
    message: 'ISO 9001 pre-audit scheduled for next week.',
    isRead: false,
    daysAgoDate: 1,
  },
  {
    userKey: 'owner_ahmed',
    title: '💰 New Order',
    message: 'TechCorp placed $85,000 PCB assembly order.',
    isRead: true,
    daysAgoDate: 3,
  },
];

export async function seedNotifications(
  prisma: PrismaClient,
  ctx: SeedContext,
): Promise<void> {
  console.log('🔔 Seeding Notifications...');

  await prisma.notification.createMany({
    data: NOTIFICATIONS.map((n) => ({
      userId: ctx.users[n.userKey],
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt:
        n.daysAgoDate !== undefined ? daysAgo(n.daysAgoDate) : new Date(),
    })),
  });

  console.log(`   ✅ Created ${NOTIFICATIONS.length} notifications`);
}

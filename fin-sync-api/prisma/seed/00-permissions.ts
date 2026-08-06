import { PrismaClient } from '@prisma/client';

const SYSTEM_PERMISSIONS = [
  // Company & Users
  { code: 'COMPANY_READ', name: 'View Company Details', module: 'Company' },
  { code: 'COMPANY_WRITE', name: 'Create & Edit Company', module: 'Company' },
  { code: 'COMPANY_DELETE', name: 'Delete Company', module: 'Company' },
  {
    code: 'COMPANY_STAFF_MANAGE',
    name: 'Manage Staff & Members',
    module: 'Company',
  },
  {
    code: 'ROLE_MANAGE',
    name: 'Manage Custom Roles & Permissions',
    module: 'Company',
  },

  // Machinery
  { code: 'MACHINERY_READ', name: 'View Machinery List', module: 'Machinery' },
  {
    code: 'MACHINERY_WRITE',
    name: 'Add & Edit Machinery',
    module: 'Machinery',
  },
  { code: 'MACHINERY_DELETE', name: 'Delete Machinery', module: 'Machinery' },
  {
    code: 'MACHINERY_OPERATE',
    name: 'Assign Operators & Log Hours',
    module: 'Machinery',
  },
  {
    code: 'MACHINERY_MAINTAIN',
    name: 'Log Machinery Maintenance',
    module: 'Machinery',
  },

  // Store & Inventory
  { code: 'STORE_READ', name: 'View Store Items & Stock', module: 'Inventory' },
  {
    code: 'STORE_WRITE',
    name: 'Add & Edit Store Items & Categories',
    module: 'Inventory',
  },
  { code: 'STORE_DELETE', name: 'Delete Store Items', module: 'Inventory' },
  {
    code: 'STORE_TRANSACTION',
    name: 'Log Stock Adjustment Transactions',
    module: 'Inventory',
  },
  {
    code: 'STORE_REQUEST_CREATE',
    name: 'Create Material Requisitions',
    module: 'Inventory',
  },
  {
    code: 'STORE_REQUEST_APPROVE',
    name: 'Approve or Reject Requisitions',
    module: 'Inventory',
  },
  {
    code: 'STORE_REQUEST_ISSUE',
    name: 'Issue Stock for Approved Requests',
    module: 'Inventory',
  },
  {
    code: 'STORE_MANAGE',
    name: 'Create & Manage Stores (Assign Storekeepers)',
    module: 'Inventory',
  },
  {
    code: 'STORE_TRANSFER_REQUEST',
    name: 'Request Stock Transfers Between Stores',
    module: 'Inventory',
  },
  {
    code: 'STORE_TRANSFER_APPROVE',
    name: 'Approve or Reject Store Transfers',
    module: 'Inventory',
  },
  {
    code: 'STORE_TRANSFER_COMPLETE',
    name: 'Complete (Execute) Approved Transfers',
    module: 'Inventory',
  },

  // Sales
  { code: 'SALES_READ', name: 'View Sales & Transactions', module: 'Sales' },
  { code: 'SALES_WRITE', name: 'Record New Sales', module: 'Sales' },
  { code: 'CUSTOMER_MANAGE', name: 'Create & View Customers', module: 'Sales' },

  // Purchases
  { code: 'PURCHASES_READ', name: 'View Purchase Orders', module: 'Purchases' },
  {
    code: 'PURCHASES_WRITE',
    name: 'Record New Purchases',
    module: 'Purchases',
  },
  {
    code: 'SUPPLIER_MANAGE',
    name: 'Create & View Suppliers',
    module: 'Purchases',
  },

  // Finance
  {
    code: 'FINANCE_INCOME_READ',
    name: 'View Income Records',
    module: 'Finance',
  },
  {
    code: 'FINANCE_INCOME_WRITE',
    name: 'Add & Modify Income Records',
    module: 'Finance',
  },
  {
    code: 'FINANCE_EXPENSE_READ',
    name: 'View Expense Records',
    module: 'Finance',
  },
  {
    code: 'FINANCE_EXPENSE_WRITE',
    name: 'Add & Modify Expense Records',
    module: 'Finance',
  },

  // Projects & HR
  { code: 'PROJECTS_READ', name: 'View Projects List', module: 'Projects' },
  {
    code: 'PROJECTS_WRITE',
    name: 'Create & Edit Projects',
    module: 'Projects',
  },
  { code: 'PROJECTS_DELETE', name: 'Delete Projects', module: 'Projects' },
  { code: 'EMPLOYEES_MANAGE', name: 'Manage Company Employees', module: 'HR' },

  // Attendance
  { code: 'ATTENDANCE_READ', name: 'View Attendance Records', module: 'HR' },
  { code: 'ATTENDANCE_WRITE', name: 'Mark & Edit Attendance', module: 'HR' },

  // Timesheets
  { code: 'TIMESHEET_SUBMIT', name: 'Submit Timesheets', module: 'HR' },
  { code: 'TIMESHEET_APPROVE', name: 'Approve Timesheets', module: 'HR' },

  // Payroll
  { code: 'PAYROLL_MANAGE', name: 'Manage Payroll', module: 'HR' },

  // Reports
  {
    code: 'REPORTS_VIEW',
    name: 'View Analytical Reports & Forecasts',
    module: 'Reports',
  },
  {
    code: 'REPORTS_EXPORT',
    name: 'Export Reports (CSV/PDF)',
    module: 'Reports',
  },

  // Chart of Accounts
  {
    code: 'ACCOUNTS_READ',
    name: 'View Chart of Accounts',
    module: 'Accounting',
  },
  {
    code: 'ACCOUNTS_WRITE',
    name: 'Create & Edit Accounts',
    module: 'Accounting',
  },

  // General Ledger
  {
    code: 'LEDGER_READ',
    name: 'View General Ledger Entries',
    module: 'Accounting',
  },
  {
    code: 'LEDGER_POST',
    name: 'Create & Post Journal Entries',
    module: 'Accounting',
  },

  // Leave Management
  {
    code: 'LEAVE_TYPE_MANAGE',
    name: 'Manage Leave Types',
    module: 'HR',
  },
  {
    code: 'LEAVE_REQUEST_CREATE',
    name: 'Submit Leave Requests',
    module: 'HR',
  },
  {
    code: 'LEAVE_REQUEST_APPROVE',
    name: 'Approve or Reject Leave Requests',
    module: 'HR',
  },
  {
    code: 'LEAVE_BALANCE_VIEW',
    name: 'View Leave Balances',
    module: 'HR',
  },

  // Tax & Payroll
  {
    code: 'TAX_TABLE_MANAGE',
    name: 'Manage Tax Tables & Brackets',
    module: 'HR',
  },
  {
    code: 'PAYSLIP_VIEW',
    name: 'View Employee Payslips',
    module: 'HR',
  },

  // Asset Depreciation
  {
    code: 'DEPRECIATION_MANAGE',
    name: 'Manage Depreciation Methods & Schedules',
    module: 'Accounting',
  },
  {
    code: 'DEPRECIATION_VIEW',
    name: 'View Depreciation Schedules & Reports',
    module: 'Accounting',
  },
];

export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  console.log('🔑 Seeding Permissions...');

  // Clear existing
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM finsync."CompanyRolePermission"`,
    );
    await prisma.$executeRawUnsafe(`DELETE FROM finsync."CompanyRole"`);
    await prisma.$executeRawUnsafe(`DELETE FROM finsync."Permission"`);
  } catch {}

  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO finsync."Permission" (code, description) VALUES ('${perm.code}', '${perm.name}') ON CONFLICT (code) DO UPDATE SET description = '${perm.name}'`,
    );
  }

  console.log(`   ✅ Created ${SYSTEM_PERMISSIONS.length} permissions`);
}

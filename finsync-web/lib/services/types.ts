// Shared domain types for FinSync frontend services

// ─── Accounting ─────────────────────────────────────────────

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "INCOME"
  | "EXPENSE";
export type AccountNormalSide = "DEBIT" | "CREDIT";

export interface Account {
  id: number;
  companyId: number;
  code: string;
  name: string;
  type: AccountType;
  category?: string;
  normalSide: AccountNormalSide;
  parentId?: number;
  parent?: { id: number; code: string; name: string };
  children?: Account[];
  isActive: boolean;
  description?: string;
  journalLines?: { _count?: number };
  _count?: { journalLines?: number };
}

export interface JournalLine {
  id: number;
  entryId: number;
  accountId: number;
  account: { id: number; code: string; name: string; type: AccountType };
  description?: string;
  debit: number;
  credit: number;
  runningBalance?: number;
}

export interface JournalEntry {
  id: number;
  companyId: number;
  entryNumber: string;
  date: string;
  description: string;
  status: "DRAFT" | "POSTED" | "VOIDED";
  sourceType?: string;
  sourceId?: number;
  projectId?: number;
  project?: { id: number; name: string };
  postedById?: number;
  postedBy?: { id: number; name: string };
  postedAt?: string;
  lines: JournalLine[];
}

export interface TrialBalanceAccount {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  normalSide: AccountNormalSide;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface TrialBalance {
  asOfDate: string;
  accounts: TrialBalanceAccount[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    difference: number;
  };
}

export interface BalanceSheetSection {
  accounts: TrialBalanceAccount[];
  total: number;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
}

export interface IncomeStatementRow {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface IncomeStatement {
  period: { startDate: string; endDate: string };
  income: { accounts: IncomeStatementRow[]; total: number };
  expenses: { accounts: IncomeStatementRow[]; total: number };
  netIncome: number;
}

// ─── Leave Management ───────────────────────────────────────

export interface LeaveType {
  id: number;
  companyId: number;
  name: string;
  isPaid: boolean;
  defaultDaysPerYear: number;
  maxCarryForwardDays?: number;
  requiresApproval: boolean;
  isActive: boolean;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  leaveType: LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  carriedForwardDays: number;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  leaveType: LeaveType;
  companyId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewedById?: number;
  reviewedBy?: { id: number; firstName: string; lastName: string };
  reviewedAt?: string;
  rejectionReason?: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

export interface LeaveCalendarEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  designation?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason?: string;
}

// ─── Payroll ────────────────────────────────────────────────

export type PayrollSourceType =
  | "ATTENDANCE"
  | "TIMESHEETS"
  | "ALL"
  | "DAILY_LABORERS";

export interface Payroll {
  id: number;
  companyId: number;
  projectId?: number;
  title: string;
  sourceType?: PayrollSourceType;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: "DRAFT" | "APPROVED" | "PAID" | "VOIDED";
  expenseId?: number;
  itemsGenerated?: number;
}

export interface PayrollItem {
  id: number;
  payrollId: number;
  employeeId: number;
  workerType?: "EMPLOYEE" | "TEMPORARY_WORKER";
  basePay: number;
  overtimeEarnings?: number;
  overtimePay: number;
  allowanceTotal?: number;
  bonusTotal?: number;
  grossPay: number;
  totalDeductions: number;
  withholdingTotal?: number;
  netPay: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  taxAmount: number;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

export interface PayslipDeduction {
  name: string;
  amount: number;
  type: string;
}

export interface Payslip {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation: string;
  };
  payroll: {
    title: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  earnings: {
    basePay: number;
    overtimeEarnings?: number;
    overtimePay: number;
    allowanceTotal?: number;
    bonusTotal?: number;
    grossPay: number;
  };
  deductions: PayslipDeduction[];
  summary: {
    totalDeductions: number;
    netPay: number;
    unpaidLeaveDays: number;
    taxAmount: number;
  };
  company: { name: string; currency: string };
}

export interface TaxBracket {
  minIncome: number;
  maxIncome?: number;
  rate: number;
  fixedAmount: number;
}

export interface TaxTable {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  isActive: boolean;
  brackets: TaxBracket[];
}

export interface PayrollDeduction {
  id: number;
  companyId: number;
  name: string;
  type: "FIXED" | "PERCENTAGE" | "BRACKET" | "LEAVE_UNPAID";
  value: number;
  isActive: boolean;
}

// ─── Store & Inventory ──────────────────────────────────────

export interface StoreCategory {
  id: number;
  companyId: number;
  name: string;
  items?: StoreItem[];
  _count?: { items: number };
}

export type StoreItemType = "CONSUMABLE" | "TOOL";

export interface StoreItem {
  id: number;
  companyId: number;
  storeId: number;
  store?: { id: number; name: string };
  name: string;
  categoryId: number;
  category?: StoreCategory;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  sellingPrice: number;
  costPrice: number;
  isTool: boolean;
  createdAt: string;
  unit: string;
}

export interface Store {
  id: number;
  companyId: number;
  name: string;
  projectId?: number;
  project?: { id: number; name: string };
  storekeeperId?: number;
  storekeeper?: { id: number; name: string; email: string };
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface StoreTransfer {
  id: number;
  fromStoreId: number;
  fromStore: { id: number; name: string; companyId?: number };
  toStoreId: number;
  toStore: { id: number; name: string; companyId?: number };
  itemId: number;
  item: { id: number; name: string; unit: string; quantity?: number };
  quantity: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedById: number;
  requestedBy: { id: number; name: string };
  approvedById?: number;
  approvedBy?: { id: number; name: string };
  completedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreRequest {
  id: number;
  itemId: number;
  companyId: number;
  userId: number;
  quantity: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ISSUED" | "RETURNED";
  note?: string;
  createdAt: string;
  projectId?: number;
  issuedQuantity: number;
  issuedById?: number;
  issuedAt?: string;
  item?: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    isTool: boolean;
  };
  user?: { id: number; name: string };
  company?: { id: number; name: string };
}

export interface StoreTransaction {
  id: number;
  itemId: number;
  companyId: number;
  type: "ISSUE" | "RESTOCK" | "RETURN";
  quantity: number;
  issuedToUserId?: number;
  date: string;
  status: string;
  note?: string;
  ledgerEntryId?: number;
  unitCost?: number;
  totalCost?: number;
  projectId?: number;
  issuedById?: number;
}

// ─── Depreciation ───────────────────────────────────────────

export interface DepreciationMethod {
  id: number;
  companyId: number;
  name: string;
  type: "STRAIGHT_LINE" | "DECLINING_BALANCE";
  defaultRate: number;
  defaultUsefulLifeYears: number;
  isActive: boolean;
}

export interface DepreciationSchedule {
  id: number;
  machineryId: number;
  startDate: string;
  endDate: string;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: "PLANNED" | "POSTED";
  journalEntryId?: number;
  machinery?: { id: number; name: string; code?: string };
}

export interface NetBookValue {
  id: number;
  name: string;
  code?: string;
  purchaseCost: number;
  residualValue: number;
  method: string;
  accumulatedDepreciation: number;
  netBookValue: number;
}

// ─── Project-Scoped ─────────────────────────────────────────

export interface ProjectFinancialSummary {
  totalIncome: number;
  totalExpense: number;
  profit: number;
}

export interface CompanyExpense {
  id: number;
  companyId: number;
  registeredBy: number;
  amount: number;
  category: string;
  date: string;
  note?: string;
  projectId?: number;
  machineryId?: number;
}

export interface CompanyIncome {
  id: number;
  companyId: number;
  registeredBy: number;
  amount: number;
  category: string;
  date: string;
  note?: string;
  projectId?: number;
  machineryId?: number;
}

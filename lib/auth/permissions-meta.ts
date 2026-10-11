import { Permission, RoleType } from "@prisma/client";

export interface PermissionDefinition {
  id: Permission;
  label: string;
  description: string;
}

export interface PermissionGroup {
  name: string;
  description: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: "Services & Pricing Catalog",
    description: "Manage digital services, photocopies, online registrations and rates",
    permissions: [
      { id: Permission.SERVICES_VIEW, label: "View Services", description: "Browse service catalog, charges and requirements" },
      { id: Permission.SERVICES_CREATE, label: "Add Services", description: "Create new services and categories" },
      { id: Permission.SERVICES_EDIT, label: "Edit Services", description: "Modify pricing, fees, and form specifications" },
      { id: Permission.SERVICES_DELETE, label: "Delete Services", description: "Remove services permanently from catalog" },
    ],
  },
  {
    name: "Service Orders & Applications",
    description: "Handle customer service requests, tracking, and counter fulfillment",
    permissions: [
      { id: Permission.ORDERS_VIEW, label: "View Orders", description: "See all active, pending, and completed service orders" },
      { id: Permission.ORDERS_CREATE, label: "Create Orders", description: "Accept new orders and record upfront counter payments" },
      { id: Permission.ORDERS_UPDATE, label: "Update Orders", description: "Change order workflow status, delivery dates, and notes" },
      { id: Permission.ORDERS_DELETE, label: "Delete Orders", description: "Cancel and delete orders (with automated refunds)" },
    ],
  },
  {
    name: "Customer Directory (CRM)",
    description: "Customer contacts, NID records, dues and advance deposit balance",
    permissions: [
      { id: Permission.CUSTOMERS_VIEW, label: "View Customers", description: "Access customer list, dues, and contact information" },
      { id: Permission.CUSTOMERS_CREATE, label: "Register Customers", description: "Add new customer profiles into the shop directory" },
      { id: Permission.CUSTOMERS_EDIT, label: "Edit Customers", description: "Update customer details, phone, NID, and advance balance" },
      { id: Permission.CUSTOMERS_DELETE, label: "Delete Customers", description: "Delete customer profiles permanently" },
    ],
  },
  {
    name: "Expense Management",
    description: "Record and review daily shop operational costs and bills",
    permissions: [
      { id: Permission.EXPENSES_VIEW, label: "View Expenses", description: "See shop expense history and categorized breakdown" },
      { id: Permission.EXPENSES_CREATE, label: "Record Expenses", description: "Log daily expenses (tea, paper, ink, electricity, rent)" },
      { id: Permission.EXPENSES_EDIT, label: "Edit Expenses", description: "Update recorded expense amounts or notes" },
      { id: Permission.EXPENSES_DELETE, label: "Delete Expenses", description: "Remove expenses and reverse cash drawer deductions" },
    ],
  },
  {
    name: "Cash Drawer & Financial Ledger",
    description: "High-sensitivity controls for drawer cash and ledger audit trail",
    permissions: [
      { id: Permission.LEDGER_VIEW, label: "View Cash Ledger", description: "Audit daily drawer balance, deposits and withdrawals" },
      { id: Permission.LEDGER_MANUAL_ADJUST, label: "Cash Adjustment", description: "Manually reconcile drawer balance discrepancies" },
      { id: Permission.LEDGER_DEPOSIT, label: "Cash Deposit", description: "Inject shop capital or add drawer cash float" },
      { id: Permission.LEDGER_WITHDRAW, label: "Cash Withdrawal", description: "Record owner profit withdrawals or bank transfers" },
    ],
  },
  {
    name: "Analytics & Data Export",
    description: "Business intelligence, revenue trend charts, and exportable sheets",
    permissions: [
      { id: Permission.ANALYTICS_VIEW, label: "View Analytics", description: "Access charts, revenue KPIs, and profit visualizations" },
      { id: Permission.EXPORT_DATA, label: "Export Data", description: "Download CSV / Excel accounting and customer reports" },
    ],
  },
  {
    name: "Administration & Security",
    description: "Team management, staff permissions, and shop configuration",
    permissions: [
      { id: Permission.USERS_VIEW, label: "View Team Members", description: "View list of staff members and their roles" },
      { id: Permission.USERS_MANAGE, label: "Manage Staff", description: "Add, edit, or configure staff accounts and permissions" },
      { id: Permission.ROLES_MANAGE, label: "Manage Roles", description: "Define and configure system roles" },
      { id: Permission.SETTINGS_MANAGE, label: "Shop Settings", description: "Configure shop name, branding, and drawer defaults" },
    ],
  },
];

export const STAFF_DEFAULT_PERMISSIONS: Permission[] = [
  Permission.SERVICES_VIEW,
  Permission.ORDERS_VIEW,
  Permission.ORDERS_CREATE,
  Permission.ORDERS_UPDATE,
  Permission.CUSTOMERS_VIEW,
  Permission.CUSTOMERS_CREATE,
  Permission.CUSTOMERS_EDIT,
  Permission.EXPENSES_VIEW,
  Permission.EXPENSES_CREATE,
];

export const ADMIN_DEFAULT_PERMISSIONS: Permission[] = [
  Permission.SERVICES_VIEW,
  Permission.SERVICES_CREATE,
  Permission.SERVICES_EDIT,
  Permission.ORDERS_VIEW,
  Permission.ORDERS_CREATE,
  Permission.ORDERS_UPDATE,
  Permission.CUSTOMERS_VIEW,
  Permission.CUSTOMERS_CREATE,
  Permission.CUSTOMERS_EDIT,
  Permission.EXPENSES_VIEW,
  Permission.EXPENSES_CREATE,
  Permission.EXPENSES_EDIT,
  Permission.LEDGER_VIEW,
  Permission.ANALYTICS_VIEW,
  Permission.EXPORT_DATA,
  Permission.USERS_VIEW,
];

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

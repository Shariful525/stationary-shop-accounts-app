import { PrismaClient, RoleType, Permission, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

const ADMIN_PERMISSIONS: Permission[] = [
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

const STAFF_PERMISSIONS: Permission[] = [
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

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Roles
  console.log("Creating default roles...");
  const superAdminRole = await prisma.role.upsert({
    where: { code: "SUPER_ADMIN" },
    update: { permissions: ALL_PERMISSIONS },
    create: {
      name: "Super Administrator",
      code: "SUPER_ADMIN",
      description: "Full, unrestricted access to all modules and financial controls.",
      isSystem: true,
      permissions: ALL_PERMISSIONS,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: { permissions: ADMIN_PERMISSIONS },
    create: {
      name: "Standard Administrator",
      code: "ADMIN",
      description: "Manages day-to-day operations, customers, orders, and reports.",
      isSystem: true,
      permissions: ADMIN_PERMISSIONS,
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { code: "STAFF" },
    update: { permissions: STAFF_PERMISSIONS },
    create: {
      name: "Shop Staff / Operator",
      code: "STAFF",
      description: "Handles customer intake, counter services, and service orders.",
      isSystem: true,
      permissions: STAFF_PERMISSIONS,
    },
  });

  // 2. Users
  console.log("Creating default users...");
  const adminPasswordHash = await bcrypt.hash("admin123456", 10);
  const staffPasswordHash = await bcrypt.hash("staff123456", 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: "admin@stationary.com" },
    update: {
      roleType: RoleType.SUPER_ADMIN,
      roleId: superAdminRole.id,
      permissions: ALL_PERMISSIONS,
    },
    create: {
      name: "Shop Owner (Super Admin)",
      email: "admin@stationary.com",
      phone: "01700000000",
      passwordHash: adminPasswordHash,
      roleType: RoleType.SUPER_ADMIN,
      roleId: superAdminRole.id,
      permissions: ALL_PERMISSIONS,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@stationary.com" },
    update: {
      roleType: RoleType.STAFF,
      roleId: staffRole.id,
      permissions: STAFF_PERMISSIONS,
    },
    create: {
      name: "Counter Staff (Operator)",
      email: "staff@stationary.com",
      phone: "01800000000",
      passwordHash: staffPasswordHash,
      roleType: RoleType.STAFF,
      roleId: staffRole.id,
      permissions: STAFF_PERMISSIONS,
      isActive: true,
    },
  });

  // 3. Cash Drawer Register
  console.log("Creating default cash drawer register...");
  const cashDrawer = await prisma.cashAccount.upsert({
    where: { id: "650000000000000000000001" },
    update: { isActive: true, isDefault: true },
    create: {
      id: "650000000000000000000001",
      name: "Shop Cash Drawer (Counter)",
      type: AccountType.CASH_DRAWER,
      currentBalance: 5000.0,
      isDefault: true,
      isActive: true,
      notes: "Main physical cash drawer register at counter",
    },
  });

  // 4. Initial Ledger Balance Entry
  const existingInitialLedger = await prisma.ledgerEntry.findFirst({
    where: { note: "Initial system opening balance" },
  });

  if (!existingInitialLedger) {
    await prisma.ledgerEntry.create({
      data: {
        entryNumber: `LED-${Date.now().toString().slice(-6)}`,
        accountId: cashDrawer.id,
        type: "DEPOSIT",
        direction: "INFLOW",
        amount: 5000.0,
        balanceBefore: 0,
        balanceAfter: 5000.0,
        source: "MANUAL_DEPOSIT",
        referenceType: "Manual",
        note: "Initial system opening balance",
        performedById: superAdminUser.id,
      },
    });
  }

  // 5. Service Categories
  console.log("Creating service categories...");
  const catGovt = await prisma.serviceCategory.upsert({
    where: { name: "Citizen & Identity Services" },
    update: {},
    create: {
      name: "Citizen & Identity Services",
      description: "Official online services for Birth Certificate, NID, and Passport.",
      icon: "FileText",
      order: 1,
    },
  });

  const catPrinting = await prisma.serviceCategory.upsert({
    where: { name: "Stationary & Printing" },
    update: {},
    create: {
      name: "Stationary & Printing",
      description: "Photocopy, color printing, laminating, and stationary supplies.",
      icon: "Printer",
      order: 2,
    },
  });

  const catAdmissions = await prisma.serviceCategory.upsert({
    where: { name: "Online Forms & Admissions" },
    update: {},
    create: {
      name: "Online Forms & Admissions",
      description: "College/University admissions, job applications, and exam admit cards.",
      icon: "GraduationCap",
      order: 3,
    },
  });

  // 6. Services with Dynamic Custom Fields
  console.log("Creating default services with custom field schemas...");
  await prisma.service.upsert({
    where: { code: "BIRTH_CERTIFICATE_APP" },
    update: {},
    create: {
      name: "Birth Certificate Online Application",
      code: "BIRTH_CERTIFICATE_APP",
      description: "Online registration and issuance support for citizen Birth Certificate.",
      categoryId: catGovt.id,
      baseCharge: 150.0,
      govtFee: 50.0,
      costPrice: 10.0,
      isActive: true,
      customFields: [
        {
          fieldId: "applicant_name",
          label: "Applicant Full Name (English & Bangla)",
          fieldType: "text",
          placeholder: "e.g., Mohammad Sharif",
          required: true,
          options: [],
        },
        {
          fieldId: "dob",
          label: "Date of Birth",
          fieldType: "date",
          placeholder: "YYYY-MM-DD",
          required: true,
          options: [],
        },
        {
          fieldId: "bris_tracking_code",
          label: "Online BRIS Application/Tracking Code",
          fieldType: "text",
          placeholder: "e.g., 2026-BR-XXXX",
          required: false,
          options: [],
        },
        {
          fieldId: "father_nid",
          label: "Father's NID Number",
          fieldType: "text",
          placeholder: "10 or 17 digit NID",
          required: false,
          options: [],
        },
      ],
    },
  });

  await prisma.service.upsert({
    where: { code: "NID_CORRECTION" },
    update: {},
    create: {
      name: "NID Information Correction & Re-issue",
      code: "NID_CORRECTION",
      description: "Correction of name, DOB, address, or re-issue of lost NID card.",
      categoryId: catGovt.id,
      baseCharge: 350.0,
      govtFee: 230.0,
      costPrice: 20.0,
      isActive: true,
      customFields: [
        {
          fieldId: "nid_number",
          label: "Existing NID Number",
          fieldType: "text",
          placeholder: "Enter 10 or 17 digit NID",
          required: true,
          options: [],
        },
        {
          fieldId: "correction_field",
          label: "Correction Type",
          fieldType: "select",
          placeholder: "Select what to correct",
          required: true,
          options: ["Name Correction", "Date of Birth", "Address Change", "Lost Card Reissue", "Photo Update"],
        },
        {
          fieldId: "voter_area",
          label: "Voter Area / Upazila",
          fieldType: "text",
          placeholder: "e.g., Dhanmondi, Dhaka",
          required: false,
          options: [],
        },
      ],
    },
  });

  await prisma.service.upsert({
    where: { code: "PASSPORT_ONLINE_FORM" },
    update: {},
    create: {
      name: "E-Passport Online Application & Appointment",
      code: "PASSPORT_ONLINE_FORM",
      description: "Online form submission, appointment scheduling, and fee payment guide.",
      categoryId: catGovt.id,
      baseCharge: 500.0,
      govtFee: 4025.0,
      costPrice: 50.0,
      isActive: true,
      customFields: [
        {
          fieldId: "passport_pages",
          label: "Passport Validity & Pages",
          fieldType: "select",
          placeholder: "Select option",
          required: true,
          options: ["48 Pages (5 Years)", "48 Pages (10 Years)", "64 Pages (5 Years)", "64 Pages (10 Years)"],
        },
        {
          fieldId: "delivery_type",
          label: "Delivery Speed",
          fieldType: "select",
          placeholder: "Select speed",
          required: true,
          options: ["Regular (15-21 Days)", "Express (7-10 Days)", "Super Express (2 Days)"],
        },
        {
          fieldId: "app_summary_number",
          label: "Online Application Summary Number",
          fieldType: "text",
          placeholder: "e.g., OID1002345678",
          required: false,
          options: [],
        },
      ],
    },
  });

  await prisma.service.upsert({
    where: { code: "PHOTOCOPY_COLOR_PRINT" },
    update: {},
    create: {
      name: "Photocopy & High-Resolution Color Printing",
      code: "PHOTOCOPY_COLOR_PRINT",
      description: "A4, Legal page printing and high quality photocopy services.",
      categoryId: catPrinting.id,
      baseCharge: 15.0,
      govtFee: 0.0,
      costPrice: 4.0,
      isActive: true,
      customFields: [
        {
          fieldId: "print_type",
          label: "Print Type",
          fieldType: "select",
          placeholder: "Select print type",
          required: true,
          options: ["B&W Photocopy", "B&W Laser Print", "Color Glossy Print", "Lamination Only"],
        },
        {
          fieldId: "page_count",
          label: "Total Pages",
          fieldType: "number",
          placeholder: "1",
          required: true,
          options: [],
        },
      ],
    },
  });

  // 7. Expense Categories
  console.log("Creating default expense categories...");
  const expenseCats = [
    { name: "Shop Rent", description: "Monthly premises rent" },
    { name: "Electricity & Utilities", description: "DESCO, generator, water utilities" },
    { name: "High-Speed Internet & WiFi", description: "Broadband subscription for online portals" },
    { name: "Printing Paper & Supplies", description: "A4 paper rims, printer ink, toner cartridges" },
    { name: "Tea & Shop Hospitality", description: "Daily customer refreshments and refreshments" },
  ];

  for (const cat of expenseCats) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
        isDefault: true,
      },
    });
  }

  // 8. Sample Customer
  console.log("Creating sample customer...");
  await prisma.customer.upsert({
    where: { id: "650000000000000000000010" },
    update: {},
    create: {
      id: "650000000000000000000010",
      name: "Rafiqul Islam",
      phone: "01711223344",
      email: "rafiqul@example.com",
      nidNumber: "19942692510000123",
      birthRegNumber: "19942692510012345",
      address: {
        street: "Holding 42, Road 7",
        area: "Dhanmondi",
        upazila: "Dhanmondi",
        district: "Dhaka",
        division: "Dhaka",
        postalCode: "1205",
      },
      currentDue: 0,
      notes: "Frequent customer for govt applications and document printing.",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("-----------------------------------------");
  console.log("Super Admin Login: admin@stationary.com / admin123456");
  console.log("Staff Login:       staff@stationary.com / staff123456");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

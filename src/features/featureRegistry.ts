export const adminFeatureRegistry = {
  auth: "auth",
  branches: "branches",
  categories: "Categories",
  configurations: "Configurations",
  dashboard: "Dashboard",
  deliveries: "Deliveries",
  employees: "Employees",
  employeeSchedules: "EmployeeSchedules",
  notifications: "Notifications",
  order: "Order",
  orders: "orders",
  payments: "Payments",
  products: "Products",
  reviews: "Reviews",
  settings: "settings",
  tables: "tables",
} as const;

export const adminRealtimeFeatures = [
  "Dashboard",
  "Notifications",
  "Orders",
] as const;

export * from "./auth";
export * from "./branches";
export * from "./Notifications";
export * from "./Order";
export * from "./Products";
export * from "./Payments";
export * from "./Employees";
export * from "./Deliveries";
export * from "./Dashboard";

export const featureRegistry = [
  "auth",
  "branches",
  "Categories",
  "Configurations",
  "Dashboard",
  "Deliveries",
  "Employees",
  "EmployeeSchedules",
  "Notifications",
  "Order",
  "orders",
  "Payments",
  "Products",
  "Reviews",
  "settings",
  "tables",
] as const;

export const architecturePrinciples = [
  "Controller/screen/view only receive and dispatch.",
  "Services and hooks own business logic.",
  "Infrastructure owns API clients, auth and realtime flow.",
  "Each feature remains encapsulated with its own domain boundary.",
] as const;

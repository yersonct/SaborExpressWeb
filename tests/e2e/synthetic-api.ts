import type { Page } from "@playwright/test";

export async function useSyntheticApi(page: Page, language: string) {
  await page.addInitScript(({ language }) => {
    for (const user of ["anonymous", "11"]) {
      localStorage.setItem(`sabor-express:${user}:language`, language);
      localStorage.setItem(`sabor-express:${user}:theme`, "light");
    }
  }, { language });
  const now = new Date().toISOString();
  const branch = { id: 1, name: "SaborExpress · yersonct", address: "Sede de prueba", phone: null, status: true, employeeCount: 1 };
  const names: Record<string, string> = {
    es: "Hamburguesa artesanal con queso y acompañamiento de la casa",
    en: "Artisan cheeseburger with the restaurant's special side dish",
    pt: "Hambúrguer artesanal com queijo e acompanhamento da casa",
    fr: "Hamburger artisanal au fromage avec accompagnement de la maison",
  };
  const product = { id: 1, categoryId: 1, categoryName: "Menú", branchId: 1, branchName: branch.name,
    name: names.es, nameEn: names.en, namePt: names.pt, nameFr: names.fr,
    description: names.es, descriptionEn: names.en, descriptionPt: names.pt, descriptionFr: names.fr,
    price: 25000, photo: null, preparationTimeInMinutes: 15, status: true, createdAt: now };
  const employee = { id: 12, userId: 12, name: "yersonct", lastName: null, document: "0000000000",
    email: "yersonct@example.invalid", phone: null, address: null, photo: null, roleNames: ["MESERO"],
    todayRoleNames: ["MESERO"], todayBranchName: branch.name, todayShiftState: "Active", branchId: 1,
    status: "Activo", basePay: 1500000, hasCv: false };
  const order = { id: 101, customerId: 21, customerName: "yersonct", employeeId: 12, employeeName: "yersonct",
    tableId: 1, tableNumber: 12, branchId: 1, branchName: branch.name, orderType: "DineIn",
    status: "Pending", subTotal: 25000, tax: 0, taxRate: 0, taxIncludedInPrice: true, deliveryFee: 0,
    total: 25000, notes: null, createdAt: now, updatedAt: now,
    orderDetails: [{ id: 1, orderId: 101, productId: 1, productName: names[language], quantity: 1, unitPrice: 25000,
      subTotal: 25000, notes: null, isToGo: false, batchNumber: 1, status: "Pending",
      lastModifiedByEmployeeId: 12, lastModifiedByEmployeeName: "yersonct" }] };
  const delivery = { id: 1, orderId: 101, addressId: 1, addressText: names[language], deliveryPersonId: 12,
    deliveryPersonName: "yersonct", status: "Assigned", assignedAt: now, deliveredAt: null,
    customerName: "yersonct", customerPhone: null, itemsCount: 1, paymentMethod: "Cash", paymentStatus: "Pending",
    customerRating: null, customerRatingComment: null, ratedAt: null };
  await page.route(/\/api\//, async (route) => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.replace(/^.*\/api(?:\/v1)?\//, "").toLowerCase();
    let body: unknown = [];
    if (endpoint.startsWith("auth/")) body = { userId: 11, identifier: "yersonct@example.invalid", roles: ["GERENTE"], employeeId: 11 };
    else if (endpoint === "user-preferences/language") body = { language, isConfigured: true };
    else if (endpoint === "user-settings/me") body = { theme: "light", emailNotifications: false, pushNotifications: false, soundNotifications: false, timeZone: "America/Bogota", updatedAt: null, isDefault: true };
    else if (endpoint === "employees/me") body = { ...employee, id: 11, name: "yersonct", branchName: branch.name, roleNames: ["GERENTE"], todayRoleName: "GERENTE" };
    else if (endpoint === "branches") body = [branch];
    else if (/^branches\/(mine|1)$/.test(endpoint)) body = branch;
    else if (endpoint.endsWith("unread-count")) body = { unreadCount: 0 };
    else if (endpoint.startsWith("branch-settings/")) body = { branchId: 1, openingTime: "08:00", closingTime: "22:00", taxRate: 0, deliveryFee: 0, deliveryRadiusKm: 5, maxActiveDeliveriesPerCourier: 3, updatedAt: null, isDefault: false };
    else if (endpoint.includes("summary")) body = { branchId: 1, totalReviews: 1, averageRating: 5 };
    else if (endpoint === "roles") body = [{ id: 1, name: "GERENTE", isActive: true }, { id: 2, name: "ADMINISTRADOR", isActive: true }, { id: 3, name: "MESERO", isActive: true }];
    else if (endpoint === "employees" || endpoint.startsWith("employees/branch/")) body = [employee];
    else if (endpoint === "products" || endpoint.startsWith("products/branch/")) body = [product];
    else if (endpoint === "categories") body = [{ id: 1, name: "Menú", nameEn: "Menu", namePt: "Cardápio", nameFr: "Carte", description: "", status: true }];
    else if (endpoint === "orders" || /^orders\/(branch|table|customer)\//.test(endpoint)) body = [order];
    else if (endpoint === "orders/101") body = order;
    else if (endpoint === "orders/101/details") body = order.orderDetails;
    else if (endpoint === "payments") body = [{ id: 1, orderId: 101, cashierId: 12, cashierName: "yersonct", method: "Cash", amount: 25000, status: "Completed", paidAt: now, wompiReference: null, wompiTransactionId: null }];
    else if (endpoint === "tables" || endpoint.startsWith("tables/branch/")) body = [{ id: 1, branchId: 1, branchName: branch.name, number: 12, status: "Occupied", currentSessionId: "synthetic", createdAt: now }];
    else if (endpoint.startsWith("employee-schedules/")) body = [{ id: 1, employeeId: 12, employeeName: "yersonct", employeeBranchId: 1, roleId: 3, roleName: "MESERO", isOwnLockedShift: false, branchId: 1, branchName: branch.name, shiftDate: url.searchParams.get("fromDate") ?? now.slice(0, 10), startTime: "08:00:00", endTime: "16:00:00" }];
    else if (endpoint.startsWith("reviews/branch/")) body = [{ id: 1, orderId: 101, customerId: 21, customerName: "yersonct", rating: 5, comment: names[language], createdAt: now }];
    else if (endpoint.startsWith("deliveries/branch/")) body = [delivery];
    await route.fulfill({ status: 200, json: body, headers: {
      "access-control-allow-origin": "http://127.0.0.1:3200",
      "access-control-allow-credentials": "true",
    } });
  });
  // Realtime transport is outside the scope of this deterministic UI matrix.
  await page.route(/\/hubs\//, (route) => route.fulfill({ status: 503, body: "" }));
}

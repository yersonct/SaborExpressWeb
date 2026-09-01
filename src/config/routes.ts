// Mapa central de rutas públicas (crípticas) del panel.
// El navegador siempre muestra estas URLs, nunca el nombre real
// de la carpeta/feature (ver rewrites en next.config.ts).
export const ROUTES = {
  login: "/login",
  dashboard: "/p1",
  orders: "/p2",
  audit: "/p3",
  products: "/p4",
  employees: "/p5",
  branches: "/p6",
  config: "/p7",
} as const;

import type { NextConfig } from "next";
import os from "os";

function getLocalNetworkIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const iface of Object.values(interfaces)) {
    for (const config of iface ?? []) {
      if (config.family === "IPv4" && !config.internal) {
        ips.push(config.address);
      }
    }
  }

  return ips;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: [...getLocalNetworkIPs(), "*.devtunnels.ms"],
  async redirects() {
    const friendlyRoutes = [
      ["/panel", "/dashboard"],
      ["/pedidos", "/orders"],
      ["/caja", "/reports"],
      ["/productos", "/products"],
      ["/equipo", "/employees"],
      ["/sedes", "/branches"],
      ["/ajustes", "/config"],
      ["/mesas", "/tables"],
      ["/horarios", "/schedules"],
      ["/domicilios", "/deliveries"],
      ["/resenas", "/reviews"],
    ];
    const folderRouteRedirects = friendlyRoutes.map(([friendly, internal]) => ({
      source: `${internal}/:path*`,
      destination: `${friendly}/:path*`,
      permanent: false,
    }));
    const oldShortRouteRedirects = friendlyRoutes.map(([friendly], index) => ({
      source: `/p${index + 1}/:path*`,
      destination: `${friendly}/:path*`,
      permanent: false,
    }));

    return [...folderRouteRedirects, ...oldShortRouteRedirects];
  },
  async rewrites() {
    return [
      { source: "/panel/:path*", destination: "/dashboard/:path*" },
      { source: "/pedidos/:path*", destination: "/orders/:path*" },
      { source: "/caja/:path*", destination: "/reports/:path*" },
      { source: "/productos/:path*", destination: "/products/:path*" },
      { source: "/equipo/:path*", destination: "/employees/:path*" },
      { source: "/sedes/:path*", destination: "/branches/:path*" },
      { source: "/ajustes/:path*", destination: "/config/:path*" },
      { source: "/mesas/:path*", destination: "/tables/:path*" },
      { source: "/horarios/:path*", destination: "/schedules/:path*" },
      { source: "/domicilios/:path*", destination: "/deliveries/:path*" },
      { source: "/resenas/:path*", destination: "/reviews/:path*" },
    ];
  },
};

export default nextConfig;

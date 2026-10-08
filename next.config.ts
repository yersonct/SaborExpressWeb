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
  async rewrites() {
    return [
      { source: "/p1", destination: "/dashboard" },
      { source: "/p2", destination: "/orders" },
      { source: "/p3", destination: "/reports" },
      { source: "/p4", destination: "/products" },
      { source: "/p5", destination: "/employees" },
      { source: "/p6", destination: "/branches" },
      { source: "/p7", destination: "/config" },
      { source: "/p8", destination: "/tables" },
      { source: "/p9", destination: "/schedules" },
      { source: "/p10", destination: "/deliveries" },
      { source: "/p11", destination: "/reviews" },
    ];
  },
};

export default nextConfig;

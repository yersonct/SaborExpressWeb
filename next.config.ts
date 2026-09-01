import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/p1", destination: "/dashboard" },
      { source: "/p2", destination: "/orders" },
      { source: "/p3", destination: "/reports" },
      { source: "/p4", destination: "/products" },
      { source: "/p5", destination: "/employees" },
      { source: "/p6", destination: "/branches" },
      { source: "/p7", destination: "/config" },
    ];
  },
};

export default nextConfig;

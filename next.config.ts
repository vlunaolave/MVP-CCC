import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/*": ["./prisma/demo.db"],
    "/api/**/*": ["./prisma/demo.db"],
  },
};

export default nextConfig;

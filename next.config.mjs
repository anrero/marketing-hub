/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "pg", "@prisma/adapter-pg", "cloudinary"],
  },
};

export default nextConfig;

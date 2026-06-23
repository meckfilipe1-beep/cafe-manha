/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // ✅ Gera pasta "out"
  images: { unoptimized: true }, // ✅ Necessário para exportação
  trailingSlash: true,
  swcMinify: false,
  experimental: { forceSwcTransforms: false }
};

module.exports = nextConfig;
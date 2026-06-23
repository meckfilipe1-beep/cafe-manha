/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,               // 🚫 Desativa o SWC que está dando erro
  experimental: {
    forceSwcTransforms: false     // Força usar o compilador normal
  }
};

module.exports = nextConfig;
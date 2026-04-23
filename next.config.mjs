/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sonhodospes.vtexassets.com',
      },
      {
        protocol: 'https',
        hostname: '**.sonhodospesoficial.com.br',
      },
    ],
  },
};

export default nextConfig;

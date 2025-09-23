/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Configurações experimentais se necessário
  },
  // Configuração para origens permitidas em desenvolvimento
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Configuração para origens de desenvolvimento permitidas
  allowedDevOrigins: [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://arkivame-teste.localhost:3000',
    'https://arkivame-teste.localhost:3000',
  ],
  // Configuração para webpack
  webpack: (config, { isServer }) => {
    // Configurações específicas do webpack se necessário
    return config;
  },
  // Configuração para imagens
  images: {
    domains: ['localhost'],
  },
  // Configuração para redirecionamentos
  async redirects() {
    return [
      // Redirecionamentos específicos se necessário
    ];
  },
  // Configuração para rewrites
  async rewrites() {
    return [
      // Rewrites específicos se necessário
    ];
  },
};

module.exports = nextConfig;


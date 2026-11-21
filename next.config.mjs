/** @type {import('next').NextConfig} */
const isStatic = false; // a versão completa usa servidor (Vercel); a prévia estática é gerada por preview/build.mjs
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  ...(isStatic ? { output: 'export', images: { unoptimized: true } } : {}),
  async headers() {
    if (isStatic) return [];
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};
export default nextConfig;

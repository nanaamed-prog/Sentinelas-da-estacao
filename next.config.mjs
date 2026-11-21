/** @type {import('next').NextConfig} */
const isStatic = false; // a versão completa usa servidor (Vercel); a prévia estática é gerada por preview/build.mjs
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  ...(isStatic ? { output: 'export', images: { unoptimized: true } } : {}),
  async headers() {
    if (isStatic) return [];
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const ws = supabase.replace(/^https:/, 'wss:');
    // Política de segurança de conteúdo: só carrega recursos do próprio app e do Supabase do projeto
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      `img-src 'self' data: blob: ${supabase}`,
      `media-src 'self' blob: ${supabase}`,
      `connect-src 'self' ${supabase} ${ws}`,
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ');
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
      ],
    }];
  },
};
export default nextConfig;

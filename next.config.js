/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  /**
   * Production security headers applied to every response.
   * These are the same headers recommended by securityheaders.com for Next.js apps.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent browsers from sniffing MIME types
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking – disallow embedding in iframes
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Limit information sent in the Referer header to cross-origin requests
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restrict browser feature access
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // DNS prefetch control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Strict Transport Security (HSTS) in production
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          /**
           * Content-Security-Policy:
           * - Avoids 'unsafe-eval'
           * - Restricts sources to strictly what the application requires
           * - Allows Socket.IO, HuggingFace, Google Generative AI, Cloudinary
           */
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
              [
                "connect-src 'self'",
                process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || 'ws://localhost:3001',
                'wss: ws:',
                'https://api-inference.huggingface.co',
                'https://generativelanguage.googleapis.com',
                'https://api.cloudinary.com',
              ].join(' '),
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "form-action 'self'",
              ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

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
          /**
           * Content-Security-Policy:
           * - Allows scripts/styles from self and CDNs used by Next.js and the app
           * - Allows connections to MongoDB Atlas, Cloudinary, HuggingFace, Google AI APIs
           * - Allows fonts from Google Fonts
           * - Restricts frames to none (no embedding)
           * Note: 'unsafe-eval' is NOT included. If a dependency requires it, address that
           *       dependency directly rather than weakening the policy globally.
           */
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline script hash placeholders
              "script-src 'self' 'unsafe-inline'",
              // Styles: self + inline styles (Next.js injects these)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Cloudinary + Unsplash + data URIs for small icons
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
              // API connections: self + external APIs + chat socket server
              [
                "connect-src 'self'",
                process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || 'ws://localhost:3001',
                'wss: ws:',
                'https://api-inference.huggingface.co',
                'https://generativelanguage.googleapis.com',
                'https://api.cloudinary.com',
              ].join(' '),
              // No iframes from anywhere
              "frame-src 'none'",
              // Object/embed tags blocked
              "object-src 'none'",
              // Form actions only to self
              "form-action 'self'",
              // Upgrade insecure requests in production
              ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

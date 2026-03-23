/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Static assets in /public (SVGs, PNGs, fonts)
        source: "/:path*.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // === Exception redirects (slug mismatches) ===
      // Spelling mismatch
      {
        source: "/haikyu-series-watch-order",
        destination: "/franchise/haikyuu",
        permanent: true,
      },
      // Sub-franchises merged into parent
      {
        source: "/dragon-ball-z-series-watch-order",
        destination: "/franchise/dragon-ball",
        permanent: true,
      },
      {
        source: "/dragon-ball-gt-series-watch-order",
        destination: "/franchise/dragon-ball",
        permanent: true,
      },
      {
        source: "/dragon-ball-super-series-watch-order",
        destination: "/franchise/dragon-ball",
        permanent: true,
      },
      {
        source: "/naruto-shippuden-series-watch-order",
        destination: "/franchise/naruto",
        permanent: true,
      },
      {
        source: "/boruto-series-watch-order",
        destination: "/franchise/naruto",
        permanent: true,
      },
      {
        source: "/full-metal-alchemist-brotherhood-series-watch-order",
        destination: "/franchise/full-metal-alchemist",
        permanent: true,
      },
      // Different slug
      {
        source: "/blood-blockade-battlefront-series-watch-order",
        destination: "/franchise/blood",
        permanent: true,
      },

      // === Generic pattern redirect ===
      {
        source: "/:slug([^/]+)-series-watch-order",
        destination: "/franchise/:slug",
        permanent: true,
      },
    ];
  },
  images: {
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
      },
      {
        protocol: "https",
        hostname: "pvxynfkwjdhpbptrxarp.supabase.co",
      },
    ],
  },
};

export default nextConfig;

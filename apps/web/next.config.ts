import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export so Pagefind can index the built HTML files in `out/`.
  // All routes are SSG (no SSR, API routes, or middleware), so this is
  // safe today and produces a self-contained static site.
  output: 'export',
  // Trailing slashes match the IA URL convention and help static hosts
  // serve `path/index.html` for clean URLs.
  trailingSlash: true,
  images: {
    // The static export does not run the image optimiser; treat any
    // future <Image> usage as plain <img>.
    unoptimized: true,
  },
};

export default nextConfig;

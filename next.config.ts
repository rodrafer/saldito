import type { NextConfig } from 'next';

/**
 * `*.dev.tsx` counts as a page only in development.
 *
 * That's what keeps /dev/kitchen-sink out of production for real, rather than
 * having it 404 at runtime: outside `next dev` the file isn't a route at all,
 * so nothing about it reaches the build. Typecheck and lint still see it.
 */
const devPageExtensions = process.env.NODE_ENV === 'development' ? ['dev.tsx'] : [];

const nextConfig: NextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', ...devPageExtensions],
  /* The dev badge floats over the bottom-left corner, which is exactly where
     the floating bar sits — it lands in every mobile screenshot. */
  devIndicators: false,
};

export default nextConfig;

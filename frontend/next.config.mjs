import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `standalone` output is ONLY for the Docker/Cloud Run self-host build
  // (see Dockerfile — it sets BUILD_STANDALONE=true). Vercel must receive the
  // default output so its builder can trace functions and route assets itself.
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,
};

export default withNextIntl(nextConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Documents (rate confirmations, BOL, POD scans) are uploaded through a
    // Server Action; Next's default body limit for those is 1MB, too small
    // for a real scanned PDF/photo. lib/actions/documents.ts enforces the
    // same 10MB ceiling at the application level.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  // Static export: emit trailing-slash dirs so deep links resolve on any static host.
  trailingSlash: true,
};

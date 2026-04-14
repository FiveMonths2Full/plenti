const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Allow service worker to control the entire site
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Cache static icons aggressively
        source: '/:path(icon-.*\\.png|apple-touch-icon\\.png|favicon\\.ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Suppress Sentry CLI output during builds
  silent: true,
  // Only upload source maps when SENTRY_DSN is set
  dryRun: !process.env.SENTRY_DSN,
  // Disable Sentry telemetry
  telemetry: false,
})

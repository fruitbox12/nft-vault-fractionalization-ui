require('dotenv').config()
const withOffline = require('next-offline')
const withImages = require('next-images')

module.exports = withOffline({
  env: {
    NETWORKS: process.env.NETWORKS,
    INFURA_ID: process.env.INFURA_ID,
    FORTMATIC: process.env.FORTMATIC,
    OPENSEA_API_KEY: process.env.OPENSEA_API_KEY,
  },
    typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  poweredByHeader: false,
  // reactStrictMode: true,
  // target: 'serverless',
  // exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
  //   return {
  //     '/': { page: '/' },
  //     '/about': { page: '/about' },
  //     '/p/hello-nextjs': { page: '/post', query: { title: 'hello-nextjs' } },
  //     '/p/learn-nextjs': { page: '/post', query: { title: 'learn-nextjs' } },
  //     '/p/deploy-nextjs': { page: '/post', query: { title: 'deploy-nextjs' } },
  //   }
  // },
  // onDemandEntries: {
  //   maxInactiveAge: 25 * 1000,
  //   pagesBufferLength: 2,
  // },
  ...withImages(),
})

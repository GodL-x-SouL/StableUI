const esbuild = require('esbuild')

console.log('Building server...')

esbuild
  .build({
    entryPoints: ['src/server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'out/server/index.cjs',
    external: [
      '@ngrok/ngrok',
      'cloudflared'
    ],
    format: 'cjs',
    sourcemap: false,
    minify: false
  })
  .then(() => {
    console.log('Server build complete: out/server/index.cjs')
  })
  .catch((err) => {
    console.error('Server build failed:', err)
    process.exit(1)
  })

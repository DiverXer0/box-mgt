import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  external: [
    'vite',
    '@replit/vite-plugin-cartographer',
    '@replit/vite-plugin-runtime-error-modal',
    'nanoid'
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
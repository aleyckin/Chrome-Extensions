const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/main.js'], 
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm', 
  target: ['chrome58'], 
  define: { 'process.env.NODE_ENV': '"production"' },
}).catch(() => process.exit(1));
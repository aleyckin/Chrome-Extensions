const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/content-script.js'], // тут твой исходный код с импортами
  bundle: true,
  outfile: 'dist/content-script.js',
  format: 'iife', // сразу запускаемый код без import
  target: ['chrome58'], // поддержка старых браузеров
  define: { 'process.env.NODE_ENV': '"production"' },
}).catch(() => process.exit(1));
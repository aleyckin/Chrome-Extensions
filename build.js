const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/main.js'], // тут твой исходный код с импортами
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm', // сразу запускаемый код без import
  target: ['chrome58'], // поддержка старых браузеров
  define: { 'process.env.NODE_ENV': '"production"' },
}).catch(() => process.exit(1));
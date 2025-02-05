const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const inputFiles = fs.readdirSync('public/js').filter(file => file.endsWith('.js'));

const buildPromises = inputFiles.map(file => {
  const inputPath = path.join('public/js', file);
  const outputPath = path.join('public/js/min', path.basename(file, '.js') + '.min.js');

  return esbuild.build({
    entryPoints: [inputPath],
    outfile: outputPath,
    bundle: true,
    minify: true,
    sourcemap: false,
    target: 'es2020',
  });
});

// Run all builds
Promise.all(buildPromises)
  .then(() => {
    console.log('Build complete');
  })
  .catch((err) => {
    console.error('Build failed', err);
    process.exit(1);
  });

import esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

const serve = process.argv.includes('--serve');
const outDir = 'dist';

// Static files are served under /spotify-iquiz/ in production, so every HTML,
// CSS and JS reference stays relative (matching the previous Parcel
// `--public-url .` output). We keep the same dist/ layout the site expects:
// index.html + callback.html at the root, assets under css/, js/, img/.
async function copyStatic() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await cp('src/index.html', `${outDir}/index.html`);
  await cp('src/callback.html', `${outDir}/callback.html`);
  await cp('src/favicon.ico', `${outDir}/favicon.ico`);
  await cp('src/favicon.png', `${outDir}/favicon.png`);
  await cp('src/css', `${outDir}/css`, { recursive: true });
  await cp('src/img', `${outDir}/img`, { recursive: true });
  // google-analytics.js has no imports; ship it as-is next to the bundle.
  await mkdir(`${outDir}/js`, { recursive: true });
  await cp('src/js/google-analytics.js', `${outDir}/js/google-analytics.js`);
}

const buildOptions = {
  entryPoints: ['src/js/main.js'],
  outfile: `${outDir}/js/main.js`,
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
};

await copyStatic();

if (serve) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.rebuild();
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: outDir, port: 8000 });
  console.log(`iQuiz dev server running at http://${host}:${port}`);
} else {
  await esbuild.build(buildOptions);
  console.log('Build complete → dist/');
}

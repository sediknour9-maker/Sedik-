// Inlines the Expo web export into one HTML page for the artifact viewer.
// usage: node scripts/build-single-html.js [distDir] [outFile]   (run `npx expo export --platform web` first)
// The viewer wraps the page in its own <!doctype>/<head>/<body> skeleton, so this writes page content only.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.argv[2] || path.join(ROOT, 'dist');
const OUT = process.argv[3] || path.join(DIST, 'atlas-fit-single.html');

const jsDir = path.join(DIST, '_expo/static/js/web');
const entry = fs.readdirSync(jsDir).find((file) => file.startsWith('entry-') && file.endsWith('.js'));
if (!entry) throw new Error(`no entry bundle in ${jsDir}`);
// A literal "</script" inside the bundle would end the inline script early.
const js = fs.readFileSync(path.join(jsDir, entry), 'utf8').replace(/<\/script/gi, '<\\/script');

const page = `<title>Atlas Fit</title>
<style>
  /* One dark look on purpose: the app ships a single dark theme. */
  :root { --page-bg: #050506; color-scheme: dark; background: var(--page-bg); }
  html { height: 100%; box-sizing: border-box; }
  body { height: 100%; margin: 0; overflow: hidden; background: var(--page-bg); }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<noscript>Atlas Fit needs JavaScript to run.</noscript>
<div id="root"></div>
<script>
  // Expo Router reads the path; the viewer serves the page under its own path, so start at the app root.
  try { history.replaceState(null, '', '/'); } catch (error) {}
</script>
<script>${js}</script>
`;

fs.writeFileSync(OUT, page);
console.log(`wrote ${OUT} (${(page.length / 1024 / 1024).toFixed(2)} MB) from ${entry}`);

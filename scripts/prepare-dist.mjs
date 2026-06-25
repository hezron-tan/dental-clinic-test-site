import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

const staticPaths = [
  'index.html',
  'login.html',
  'admin',
  'staff',
  'assets',
  'css',
  'images',
  'js',
  '.nojekyll'
];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const item of staticPaths) {
  const source = join(root, item);
  if (!existsSync(source)) {
    console.warn('Skipping missing path:', item);
    continue;
  }
  cpSync(source, join(dist, item), { recursive: true });
}

if (!existsSync(join(dist, 'js', 'config.js'))) {
  console.error('dist/js/config.js is missing. Run generate-config.mjs first.');
  process.exit(1);
}

writeFileSync(
  join(dist, '.gitkeep-deploy'),
  'Static site bundle for GitHub Pages\n',
  'utf8'
);

console.log('Prepared dist/ for deployment');

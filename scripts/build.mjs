import { mkdir, rm, cp } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
  const projectRoot = resolve(__dirname, '..');
  const srcDir = resolve(projectRoot, 'src');
  const distDir = resolve(projectRoot, 'dist');

  // Clean dist
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  // Copy src → dist recursively (Node 18+)
  await cp(srcDir, distDir, { recursive: true });

  console.log('Build complete: src → dist');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Apply a theme overlay by copying src/themes/<theme>/overrides.css
 * to src/themes/active-theme.css and ensuring it's imported by src/main.tsx.
 *
 * Usage (PowerShell):
 *   npx tsx scripts/apply-theme.ts <theme-folder>
 *   e.g. npx tsx scripts/apply-theme.ts brand-example
 */

const projectRoot = process.cwd();
const themesDir = join(projectRoot, 'src', 'themes');
const mainFile = join(projectRoot, 'src', 'main.tsx');
const activeThemeCss = join(themesDir, 'active-theme.css');

function fail(message: string): never {
  console.error(`[apply-theme] ${message}`);
  process.exit(1);
}

function ensureImportInMain() {
  if (!existsSync(mainFile)) {
    fail(`Cannot find src/main.tsx at ${mainFile}`);
  }
  const original = readFileSync(mainFile, 'utf8');
  const importLine = `import './themes/active-theme.css';`;
  if (original.includes(importLine)) {
    return; // already wired
  }
  // Insert after the existing index.css import if present; otherwise after first import.
  const lines = original.split(/\r?\n/);
  const indexCssIdx = lines.findIndex((l) => l.includes("import './index.css'"));
  const firstImportIdx = lines.findIndex((l) => l.startsWith('import '));
  const insertIdx = indexCssIdx >= 0 ? indexCssIdx + 1 : firstImportIdx >= 0 ? firstImportIdx + 1 : 0;
  lines.splice(insertIdx, 0, importLine);
  const updated = lines.join('\n');
  writeFileSync(mainFile, updated, 'utf8');
  console.log('[apply-theme] Injected active-theme.css import into src/main.tsx');
}

function copyTheme(themeName: string) {
  const source = join(themesDir, themeName, 'overrides.css');
  if (!existsSync(source)) {
    fail(`Theme '${themeName}' not found at ${source}`);
  }
  if (!existsSync(themesDir)) {
    mkdirSync(themesDir, { recursive: true });
  }
  const css = readFileSync(source, 'utf8');
  writeFileSync(activeThemeCss, css, 'utf8');
  console.log(`[apply-theme] Wrote ${activeThemeCss}`);
}

function main() {
  const theme = process.argv[2];
  if (!theme) {
    fail('Missing <theme-folder> argument. Example: npx tsx scripts/apply-theme.ts brand-example');
  }
  copyTheme(theme);
  ensureImportInMain();
  console.log(`[apply-theme] Applied theme '${theme}'.`);
}

main();













import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * apply-branding.ts
 * Idempotently ensures a pixel-cube favicon.svg exists using the current theme color
 * and that index.html references it (with .ico fallback retained).
 *
 * Usage:
 *   npx tsx scripts/apply-branding.ts
 */

const projectRoot = process.cwd();
const indexHtmlPath = join(projectRoot, 'index.html');
const faviconSvgPath = join(projectRoot, 'public', 'favicon.svg');
const themeCssPath = join(projectRoot, 'src', 'themes', 'active-theme.css');
const baseIndexCssPath = join(projectRoot, 'src', 'index.css');

function getAccentColor(): string {
	// Prefer active theme override; fall back to base index.css var
	let css = '';
	if (existsSync(themeCssPath)) {
		css = readFileSync(themeCssPath, 'utf8');
		const m = css.match(/--build-accent-color:\s*([^;]+);/);
		if (m) return m[1].trim();
	}
	if (existsSync(baseIndexCssPath)) {
		css = readFileSync(baseIndexCssPath, 'utf8');
		const m = css.match(/--build-accent-color:\s*([^;]+);/);
		if (m) return m[1].trim();
	}
	return '#ff3d00';
}

function ensureFaviconSvg(accent: string) {
	const gradientEnd = accent;
	const gradientStart = accent;
	const template = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n  <defs>\n    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0" stop-color="${gradientStart}"/>\n      <stop offset="1" stop-color="${gradientEnd}"/>\n    </linearGradient>\n  </defs>\n  <rect width="64" height="64" rx="12" fill="#ffffff"/>\n  <g transform="translate(18,12)">\n    <rect x="0" y="24" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="0" y="32" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="0" y="40" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="8" y="16" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="8" y="24" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="8" y="32" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="8" y="40" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="16" y="8"  width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="16" y="16" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="16" y="24" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="16" y="32" width="6" height="6" rx="1" fill="#e9e9e9"/>\n    <rect x="8"  y="8"  width="6" height="6" rx="1" fill="url(#g)"/>\n    <rect x="16" y="0"  width="6" height="6" rx="1" fill="url(#g)"/>\n    <rect x="24" y="8"  width="6" height="6" rx="1" fill="url(#g)"/>\n  </g>\n</svg>\n`;
	writeFileSync(faviconSvgPath, template, 'utf8');
	console.log(`[apply-branding] Wrote ${faviconSvgPath}`);
}

function ensureIndexLinks() {
	if (!existsSync(indexHtmlPath)) return;
	const html = readFileSync(indexHtmlPath, 'utf8');
	let updated = html;
	if (!html.includes('rel="icon" type="image/svg+xml"')) {
		updated = html.replace(
			/<link\s+rel="icon"\s+href="\/favicon\.ico"\s*\/>/,
			'<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n\t\t<link rel="icon" href="/favicon.ico" />'
		);
	}
	if (updated !== html) {
		writeFileSync(indexHtmlPath, updated, 'utf8');
		console.log('[apply-branding] Updated index.html favicon links');
	} else {
		console.log('[apply-branding] index.html favicon links already set');
	}
}

function main() {
	const accent = getAccentColor();
	ensureFaviconSvg(accent);
	ensureIndexLinks();
	console.log(`[apply-branding] Applied favicon branding with accent ${accent}`);
}

main();




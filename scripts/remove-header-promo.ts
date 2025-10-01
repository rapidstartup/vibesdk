import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * remove-header-promo.ts
 * Idempotent script to remove the promo banner ("Deploy your own vibe-coding platform"
 * and its two buttons) from src/components/layout/global-header.tsx.
 * Also removes an unused GithubIcon import if present and unused afterwards.
 *
 * Usage:
 *   npx tsx scripts/remove-header-promo.ts
 */

const projectRoot = process.cwd();
const headerPath = join(projectRoot, 'src', 'components', 'layout', 'global-header.tsx');

function removeSegmentByTagBalance(source: string, startAnchor: string): { updated: string; changed: boolean } {
	const start = source.indexOf(startAnchor);
	if (start === -1) return { updated: source, changed: false };

	const openIdx = start;

	const tagRegex = /<\/?div\b/g;
	tagRegex.lastIndex = openIdx;
	let depth = 0;
	let endIdx = -1;
	let match: RegExpExecArray | null;

	while ((match = tagRegex.exec(source))) {
		const token = match[0];
		if (token === '<div') {
			depth += 1;
		} else if (token === '</div') {
			depth -= 1;
			if (depth === 0) {
				const closeGt = source.indexOf('>', match.index);
				endIdx = closeGt === -1 ? match.index : closeGt + 1;
				break;
			}
		}
	}

	if (endIdx === -1) return { updated: source, changed: false };

	let cutTo = endIdx;
	while (cutTo < source.length && (source[cutTo] === '\n' || source[cutTo] === '\r' || source[cutTo] === '\t' || source[cutTo] === ' ')) {
		cutTo++;
		if (source[cutTo - 1] === '\n') break;
	}

	const updated = source.slice(0, openIdx) + source.slice(cutTo);
	return { updated, changed: true };
}

function removeUnusedGithubIconImport(source: string): string {
	// Remove all import lines to check for actual usage in code body
	const bodyWithoutImports = source.replace(/^import[^\n]*;\s*$/gm, '');
	const isUsedOutsideImports = bodyWithoutImports.includes('GithubIcon');
	if (isUsedOutsideImports) return source;

	// Remove a simple named import line: import { GithubIcon } from 'lucide-react';
	const importLineRegex = /^import\s*\{\s*GithubIcon\s*\}\s*from\s*'lucide-react';\s*\r?\n/m;
	if (importLineRegex.test(source)) {
		return source.replace(importLineRegex, '');
	}
	// Handle possible grouped import: import { GithubIcon, SomethingElse } from 'lucide-react';
	const groupedRegex = /import\s*\{([^}]+)\}\s*from\s*'lucide-react';/m;
	const m = groupedRegex.exec(source);
	if (m) {
		const names = m[1]
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.filter((n) => n !== 'GithubIcon');
		if (names.length === 0) {
			return source.replace(groupedRegex, '');
		}
		const replacement = `import { ${names.join(', ')} } from 'lucide-react';`;
		return source.replace(groupedRegex, replacement);
	}
	return source;
}

function main() {
	if (!existsSync(headerPath)) {
		console.error(`[remove-header-promo] File not found: ${headerPath}`);
		process.exit(1);
	}

	const original = readFileSync(headerPath, 'utf8');

	let updated = original;
	let changed = false;

	if (original.includes('Deploy your own vibe-coding platform')) {
		const anchor = '<div className="gap-6';
		({ updated, changed } = removeSegmentByTagBalance(original, anchor));

		if (!changed) {
			const fallbackAnchor = '<div className="flex w-full gap-2 items-center">';
			({ updated, changed } = removeSegmentByTagBalance(original, fallbackAnchor));
		}
	}

	// Clean up GithubIcon import if it became unused (even if promo was already gone)
	const cleaned = removeUnusedGithubIconImport(updated);

	if (cleaned === original) {
		console.log('[remove-header-promo] No changes needed.');
		return;
	}

	writeFileSync(headerPath, cleaned, 'utf8');
	console.log('[remove-header-promo] Applied cleanup successfully.');
}

main();

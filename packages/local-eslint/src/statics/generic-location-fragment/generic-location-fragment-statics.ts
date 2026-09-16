/**
 * PURPOSE: The bare filename extensions a `locationsStatics` value must never equal.
 * `no-bare-location-literals` bans every `locationsStatics` value repo-wide, so an extension
 * fragment landing there (as `.jsonl`/`.json`/`.png`/`.sock` once did in the `siegelense` group)
 * makes every OTHER package's own, unrelated use of that same extension a lint failure the
 * moment it lands — this list backs the regression guard that catches a repeat before lint does.
 *
 * USAGE:
 * genericLocationFragmentStatics.extensions.includes('.json');
 * // Returns true
 */

export const genericLocationFragmentStatics = {
  extensions: [
    '.json',
    '.jsonl',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.sock',
    '.txt',
    '.log',
    '.md',
    '.js',
    '.ts',
    '.tsx',
    '.jsx',
    '.mjs',
    '.cjs',
    '.css',
    '.html',
    '.xml',
    '.yaml',
    '.yml',
    '.csv',
    '.lock',
    '.tmp',
    '.zip',
    '.tar',
    '.gz',
    '.pdf',
  ],
} as const;

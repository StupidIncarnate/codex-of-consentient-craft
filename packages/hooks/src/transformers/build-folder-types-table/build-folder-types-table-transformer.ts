/**
 * PURPOSE: Generates a markdown folder types table from folderConfigStatics for session snippet delivery
 *
 * USAGE:
 * const table = buildFolderTypesTableTransformer();
 * // Returns ContentText with markdown table of folder types, purposes, and when-to-use guidance
 *
 * WHEN-TO-USE: When the session-snippet hook needs the folder types table generated from config
 */

import { folderConfigStatics } from '@dungeonmaster/shared/statics';

export const buildFolderTypesTableTransformer = (): string => {
  const entries = Object.entries(folderConfigStatics)
    .map(([key, config]) => ({
      key,
      depth: config.folderDepth,
      purpose: config.meta.purpose.split('.')[0],
      whenToUse: config.meta.whenToUse,
    }))
    .sort((a, b) => {
      const depthDiff = a.depth - b.depth;
      return depthDiff === 0 ? a.key.localeCompare(b.key) : depthDiff;
    });

  const header = '| Folder | Purpose | When to Use |\n|--------|---------|-------------|';
  const rows = entries.map(({ key, purpose, whenToUse }) =>
    `| ${key}/ | ${purpose} | ${whenToUse} |`,
  );

  return `## Folder Types\n\n${header}\n${rows.join('\n')}`;
};

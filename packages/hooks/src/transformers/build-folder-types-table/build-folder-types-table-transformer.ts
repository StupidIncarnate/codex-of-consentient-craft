/**
 * PURPOSE: Generates a markdown folder types table from folderConfigStatics for session snippet delivery
 *
 * USAGE:
 * const table = buildFolderTypesTableTransformer();
 * // Returns ContentText with markdown table of folder types, purposes, and when-to-use guidance
 *
 * WHEN-TO-USE: When the session-snippet hook needs the folder types table generated from config
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

export const buildFolderTypesTableTransformer = (): ContentText => {
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

  const header = contentTextContract.parse(
    '| Folder | Purpose | When to Use |\n|--------|---------|-------------|',
  );
  const rows = entries.map(({ key, purpose, whenToUse }) =>
    contentTextContract.parse(`| ${key}/ | ${purpose} | ${whenToUse} |`),
  );

  return contentTextContract.parse(`## Folder Types\n\n${header}\n${rows.join('\n')}`);
};

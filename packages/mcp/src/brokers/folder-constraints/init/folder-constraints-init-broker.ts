/**
 * PURPOSE: Load all folder constraint markdown files into memory
 *
 * USAGE:
 * const {folderConstraints} = await folderConstraintsInitBroker();
 * // Returns Map of folder types to constraint content
 */
import { folderConstraintsStatics } from '../../../statics/folder-constraints/folder-constraints-statics';
import { resolve } from '#gateway/node/path';
import { readFile } from '#gateway/node/fs__promises';
import { stderr } from '#gateway/node/process';
import type { FolderType } from '@dungeonmaster/shared/contracts';

export const folderConstraintsInitBroker = async (): Promise<{
  folderConstraints: Map<FolderType, string>;
}> => {
  const constraintsMap = new Map<FolderType, string>();
  const constraintsDir = resolve(__dirname, '../../../statics/folder-constraints');

  // Load each folder-specific constraint file using Promise.all
  const entries = Object.entries(folderConstraintsStatics);
  const results = await Promise.all(
    entries.map(async ([folderType, filename]) => {
      try {
        const filepath = resolve(constraintsDir, filename);
        const content = await readFile(filepath);
        const validated = `\n${content}`;
        return { folderType, content: validated, error: null };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { folderType, content: null, error: errorMessage };
      }
    }),
  );

  // Process results
  for (const result of results) {
    if (result.content) {
      constraintsMap.set(result.folderType, result.content);
    } else {
      stderr.write(
        `Warning: Could not load constraint file for ${result.folderType}: ${result.error}\n`,
      );
    }
  }

  return { folderConstraints: constraintsMap };
};

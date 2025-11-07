/**
 * PURPOSE: Load all folder constraint markdown files into memory
 *
 * USAGE:
 * const {folderConstraints} = await folderConstraintsInitBroker();
 * // Returns Map of folder types to constraint content
 */
import { folderConstraintsStatics } from '../../../statics/folder-constraints/folder-constraints-statics';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { FolderType } from '@questmaestro/shared/contracts';

export const folderConstraintsInitBroker = async (): Promise<{
  folderConstraints: Map<FolderType, ContentText>;
}> => {
  const constraintsMap = new Map<FolderType, ContentText>();
  const constraintsDir = pathResolveAdapter({
    paths: [__dirname, '../../../statics/folder-constraints'],
  });

  // Load each folder-specific constraint file
  for (const [folderType, filename] of Object.entries(folderConstraintsStatics)) {
    try {
      const filepath = pathResolveAdapter({ paths: [constraintsDir, filename] });
      const content = await fsReadFileAdapter({ filepath });
      const validated = contentTextContract.parse(`\n${content}`);

      constraintsMap.set(folderType as FolderType, validated);
    } catch (error) {
      // If file doesn't exist, skip (graceful degradation)
      // Log error but don't fail startup
      process.stderr.write(`Warning: Could not load constraint file for ${folderType}: ${error}\n`);
    }
  }

  return { folderConstraints: constraintsMap };
};

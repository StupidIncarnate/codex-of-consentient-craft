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
  layerConstraints: ContentText;
}> => {
  const constraintsMap = new Map<FolderType, ContentText>();
  const constraintsDir = pathResolveAdapter({
    paths: [__dirname, '../../../statics/folder-constraints'],
  });

  // Load each folder-specific constraint file using Promise.all
  const entries = Object.entries(folderConstraintsStatics);
  const results = await Promise.all(
    entries.map(async ([folderType, filename]) => {
      try {
        const filepath = pathResolveAdapter({ paths: [constraintsDir, filename] });
        const content = await fsReadFileAdapter({ filepath });
        const validated = contentTextContract.parse(`\n${content}`);
        return { folderType: folderType as FolderType, content: validated, error: null };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { folderType: folderType as FolderType, content: null, error: errorMessage };
      }
    }),
  );

  // Process results
  for (const result of results) {
    if (result.content) {
      constraintsMap.set(result.folderType, result.content);
    } else {
      process.stderr.write(
        `Warning: Could not load constraint file for ${result.folderType}: ${result.error}\n`,
      );
    }
  }

  // Load layer constraints file
  const layerConstraintsPath = pathResolveAdapter({
    paths: [constraintsDir, 'layer-constraints.md'],
  });
  const layerContent = await fsReadFileAdapter({ filepath: layerConstraintsPath });
  const layerConstraints = contentTextContract.parse(`\n${layerContent}`);

  return { folderConstraints: constraintsMap, layerConstraints };
};

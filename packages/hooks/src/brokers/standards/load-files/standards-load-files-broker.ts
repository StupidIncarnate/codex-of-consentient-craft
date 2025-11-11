/**
 * PURPOSE: Loads questmaestro standards markdown files from node_modules
 *
 * USAGE:
 * const standards = await standardsLoadFilesBroker({ cwd: '/project/path' });
 * // Returns concatenated string of coding and testing standards
 */
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { debugDebugAdapter } from '../../../adapters/debug/debug/debug-debug-adapter';
import { standardsFilesStatics } from '../../../statics/standards-files/standards-files-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import {
  fileContentsContract,
  type FileContents,
} from '../../../contracts/file-contents/file-contents-contract';

export const standardsLoadFilesBroker = async ({
  cwd,
}: {
  cwd: FilePath;
}): Promise<FileContents> => {
  const log = debugDebugAdapter({ namespace: 'questmaestro:session-start-hook' });
  const standardsFiles = standardsFilesStatics;

  const standardsPath = pathResolveAdapter({
    paths: [cwd, 'node_modules/@questmaestro/standards'],
  });

  // Load all files in parallel
  const fileContents = await Promise.all(
    standardsFiles.map(async (file) => {
      const filePath = pathResolveAdapter({ paths: [standardsPath, file] });

      if (fsExistsSyncAdapter({ filePath })) {
        try {
          const fileContent = await fsReadFileAdapter({ filePath });
          log(`Loaded standards file: ${file}`);
          // Only add headers if content is not empty/whitespace
          if (fileContent.trim()) {
            return `\n\n# ${file.replace('.md', '').replace('-', ' ').toUpperCase()}\n\n${fileContent}`;
          }
          return '';
        } catch (error) {
          log(`Failed to load ${file}:`, error);
          return '';
        }
      } else {
        log(`Standards file not found: ${filePath}`);
        return '';
      }
    }),
  );

  return fileContentsContract.parse(fileContents.join(''));
};

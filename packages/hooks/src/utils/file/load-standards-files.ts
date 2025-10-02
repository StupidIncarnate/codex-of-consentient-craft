import { fsReadFile } from '../../adapters/fs/fs-read-file';
import { pathResolve } from '../../adapters/path/path-resolve';
import { fsExistsSync } from '../../adapters/fs/fs-exists-sync';
import { debugDebug } from '../../adapters/debug/debug-debug';

const log = debugDebug({ namespace: 'questmaestro:session-start-hook' });

export const loadStandardsFiles = async ({ cwd }: { cwd: string }): Promise<string> => {
  const standardsFiles = ['coding-standards.md', 'testing-standards.md'];

  const standardsPath = pathResolve({ paths: [cwd, 'node_modules/@questmaestro/standards'] });

  // Load all files in parallel
  const fileContents = await Promise.all(
    standardsFiles.map(async (file) => {
      const filePath = pathResolve({ paths: [standardsPath, file] });

      if (fsExistsSync({ filePath })) {
        try {
          const fileContent = await fsReadFile({ filePath });
          log(`Loaded standards file: ${file}`);
          return `\n\n# ${file.replace('.md', '').replace('-', ' ').toUpperCase()}\n\n${fileContent}`;
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

  return fileContents.join('');
};

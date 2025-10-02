import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import debug from 'debug';

const log = debug('questmaestro:session-start-hook');

export const loadStandardsFiles = async ({ cwd }: { cwd: string }): Promise<string> => {
  const standardsFiles = ['coding-standards.md', 'testing-standards.md'];

  const standardsPath = resolve(cwd, 'node_modules/@questmaestro/standards');

  // Load all files in parallel
  const fileContents = await Promise.all(
    standardsFiles.map(async (file) => {
      const filePath = resolve(standardsPath, file);

      if (existsSync(filePath)) {
        try {
          const fileContent = await readFile(filePath, 'utf8');
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

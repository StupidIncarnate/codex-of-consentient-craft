import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import debug from 'debug';

const log = debug('questmaestro:session-start-hook');

export const fileUtilLoadStandardsFiles = async ({ cwd }: { cwd: string }) => {
  const standardsFiles = ['coding-standards.md', 'testing-standards.md'];

  const standardsPath = resolve(cwd, 'node_modules/@questmaestro/standards');
  let content = '';

  for (const file of standardsFiles) {
    const filePath = resolve(standardsPath, file);

    if (existsSync(filePath)) {
      try {
        const fileContent = await readFile(filePath, 'utf8');
        content += `\n\n# ${file.replace('.md', '').replace('-', ' ').toUpperCase()}\n\n`;
        content += fileContent;
        log(`Loaded standards file: ${file}`);
      } catch (error) {
        log(`Failed to load ${file}:`, error);
      }
    } else {
      log(`Standards file not found: ${filePath}`);
    }
  }

  return content;
};

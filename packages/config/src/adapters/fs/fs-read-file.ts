import { readFile } from 'fs/promises';

export const fsReadFile = async ({ filePath }: { filePath: string }): Promise<string> =>
  await readFile(filePath, 'utf8');

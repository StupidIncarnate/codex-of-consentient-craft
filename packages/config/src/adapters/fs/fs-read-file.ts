import { readFile } from 'fs/promises';

export const fsReadFile = async ({ filePath }: { filePath: string }): Promise<string> =>
  readFile(filePath, 'utf8');

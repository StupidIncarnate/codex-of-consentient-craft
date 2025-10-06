import { existsSync } from 'fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const fsExistsSyncAdapter = ({ filePath }: { filePath: FilePath }): boolean =>
  existsSync(filePath);

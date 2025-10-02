import { existsSync } from 'fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const fsExistsSync = ({ filePath }: { filePath: FilePath }): boolean => existsSync(filePath);

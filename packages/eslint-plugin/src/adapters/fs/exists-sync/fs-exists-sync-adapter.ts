import { existsSync } from 'fs';
import type { FilePath } from '@questmaestro/shared/contracts';

export const fsExistsSyncAdapter = ({ filePath }: { filePath: FilePath }): boolean =>
  existsSync(filePath);

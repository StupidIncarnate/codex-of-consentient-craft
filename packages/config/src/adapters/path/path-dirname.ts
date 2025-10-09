import { dirname } from 'path';
import type { FilePath } from '@questmaestro/shared/contracts';
import { filePathContract } from '@questmaestro/shared/contracts';

export const pathDirname = ({ path }: { path: FilePath }): FilePath =>
  filePathContract.parse(dirname(path));

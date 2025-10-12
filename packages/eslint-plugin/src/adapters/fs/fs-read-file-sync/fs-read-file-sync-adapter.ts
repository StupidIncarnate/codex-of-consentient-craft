import { readFileSync } from 'fs';
import type { FilePath } from '@questmaestro/shared/contracts';

export const fsReadFileSyncAdapter = ({
  filePath,
  encoding,
}: {
  filePath: FilePath | string;
  encoding?: BufferEncoding;
}): string => readFileSync(String(filePath), encoding || 'utf-8');

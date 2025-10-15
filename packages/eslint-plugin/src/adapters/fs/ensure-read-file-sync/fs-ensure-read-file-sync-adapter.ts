import { existsSync, readFileSync } from 'fs';
import { fileContentsContract } from '@questmaestro/shared/contracts';
import type { FilePath, FileContents } from '@questmaestro/shared/contracts';

export const fsEnsureReadFileSyncAdapter = ({
  filePath,
  encoding,
}: {
  filePath: FilePath;
  encoding?: BufferEncoding;
}): FileContents => {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const contents = readFileSync(filePath, encoding ?? 'utf-8');
  return fileContentsContract.parse(contents);
};

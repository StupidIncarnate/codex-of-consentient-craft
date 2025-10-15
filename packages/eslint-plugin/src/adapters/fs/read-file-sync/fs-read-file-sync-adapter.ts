import { readFileSync } from 'fs';
import { fileContentsContract } from '@questmaestro/shared/contracts';
import type { FilePath, FileContents } from '@questmaestro/shared/contracts';

export const fsReadFileSyncAdapter = ({
  filePath,
  encoding,
}: {
  filePath: FilePath;
  encoding?: BufferEncoding;
}): FileContents => {
  const contents = readFileSync(filePath, encoding ?? 'utf-8');
  return fileContentsContract.parse(contents);
};

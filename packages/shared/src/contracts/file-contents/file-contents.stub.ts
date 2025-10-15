import { fileContentsContract } from './file-contents-contract';
import type { FileContents } from './file-contents-contract';

export const FileContentsStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'test file contents',
  },
): FileContents => fileContentsContract.parse(value);

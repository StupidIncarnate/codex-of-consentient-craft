import { fileContentsContract } from './file-contents-contract';
import type { FileContents } from './file-contents-contract';

export const FileContentsStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'export const example = "test";',
  },
): FileContents => fileContentsContract.parse(value);

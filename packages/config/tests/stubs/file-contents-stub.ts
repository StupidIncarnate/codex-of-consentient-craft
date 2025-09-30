import {
  fileContentsContract,
  type FileContents,
} from '../../src/contracts/file-contents/file-contents-contract';

export const FileContentsStub = (value: string): FileContents => {
  return fileContentsContract.parse(value);
};

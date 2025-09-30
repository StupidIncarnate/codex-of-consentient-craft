import { fileContentsContract, type FileContents } from './file-contents-contract';

export const FileContentsStub = (value: string): FileContents => fileContentsContract.parse(value);

import { fileContentContract, type FileContent } from './file-content-contract';

export const FileContentStub = (
  { value }: { value: string } = { value: 'test content' },
): FileContent => fileContentContract.parse(value);

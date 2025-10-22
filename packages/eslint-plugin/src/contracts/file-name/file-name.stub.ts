import { fileNameContract } from './file-name-contract';
import type { FileName } from './file-name-contract';

export const FileNameStub = ({ value }: { value: string } = { value: 'test-file.ts' }): FileName =>
  fileNameContract.parse(value);

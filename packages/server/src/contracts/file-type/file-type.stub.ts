import { fileTypeContract } from './file-type-contract';
import type { FileType } from './file-type-contract';

export const FileTypeStub = ({ value }: { value: string } = { value: 'broker' }): FileType =>
  fileTypeContract.parse(value);

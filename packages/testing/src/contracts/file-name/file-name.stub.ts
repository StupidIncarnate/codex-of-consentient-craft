import { fileNameContract, type FileName } from './file-name-contract';

export const FileNameStub = ({ value }: { value: string } = { value: 'test.txt' }): FileName =>
  fileNameContract.parse(value);

import { fileSizeBytesContract, type FileSizeBytes } from './file-size-bytes-contract';

export const FileSizeBytesStub = ({ value }: { value: number } = { value: 2048 }): FileSizeBytes =>
  fileSizeBytesContract.parse(value);

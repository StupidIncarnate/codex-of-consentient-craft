import { fileDescriptorContract, type FileDescriptor } from './file-descriptor-contract';

export const FileDescriptorStub = ({ value }: { value: number } = { value: 3 }): FileDescriptor =>
  fileDescriptorContract.parse(value);

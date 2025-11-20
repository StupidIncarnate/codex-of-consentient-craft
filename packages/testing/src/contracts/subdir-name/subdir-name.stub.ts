import { subdirNameContract, type SubdirName } from './subdir-name-contract';

export const SubdirNameStub = ({ value }: { value: string } = { value: 'src' }): SubdirName =>
  subdirNameContract.parse(value);

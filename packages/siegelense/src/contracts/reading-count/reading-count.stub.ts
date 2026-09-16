import { readingCountContract, type ReadingCount } from './reading-count-contract';

export const ReadingCountStub = ({ value }: { value: number } = { value: 0 }): ReadingCount =>
  readingCountContract.parse(value);

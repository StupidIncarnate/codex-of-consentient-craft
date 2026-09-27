import { bucketStartKeyContract } from './bucket-start-key-contract';
import type { BucketStartKey } from './bucket-start-key-contract';

export const BucketStartKeyStub = (
  { value }: { value: string } = { value: '1700000000000' },
): BucketStartKey => bucketStartKeyContract.parse(value);

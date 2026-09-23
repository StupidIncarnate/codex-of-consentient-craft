import { bucketMinutesContract, type BucketMinutes } from './bucket-minutes-contract';

export const BucketMinutesStub = (
  { value }: { value: string | number } = { value: 5 },
): BucketMinutes => bucketMinutesContract.parse(value);

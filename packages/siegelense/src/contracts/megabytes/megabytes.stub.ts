import { megabytesContract } from './megabytes-contract';
import type { Megabytes } from './megabytes-contract';

export const MegabytesStub = ({ value }: { value: number } = { value: 1840 }): Megabytes =>
  megabytesContract.parse(value);

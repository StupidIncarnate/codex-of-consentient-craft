import { tailStartIndexContract } from './tail-start-index-contract';
import type { TailStartIndex } from './tail-start-index-contract';

export const TailStartIndexStub = ({ value }: { value?: number } = {}): TailStartIndex =>
  tailStartIndexContract.parse(value ?? 0);

import { streamingBlockCountContract } from './streaming-block-count-contract';
import type { StreamingBlockCount } from './streaming-block-count-contract';

export const StreamingBlockCountStub = ({ value }: { value?: number } = {}): StreamingBlockCount =>
  streamingBlockCountContract.parse(value ?? 0);

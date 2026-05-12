import { trailingThinkingIndexContract } from './trailing-thinking-index-contract';
import type { TrailingThinkingIndex } from './trailing-thinking-index-contract';

export const TrailingThinkingIndexStub = ({
  value,
}: { value?: number } = {}): TrailingThinkingIndex =>
  trailingThinkingIndexContract.parse(value ?? -1);

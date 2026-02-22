import { contextTokenDeltaContract } from './context-token-delta-contract';
import type { ContextTokenDelta } from './context-token-delta-contract';

export const ContextTokenDeltaStub = ({ value }: { value?: number } = {}): ContextTokenDelta =>
  contextTokenDeltaContract.parse(value ?? 2100);

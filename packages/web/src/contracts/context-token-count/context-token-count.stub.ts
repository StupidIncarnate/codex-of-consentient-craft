import { contextTokenCountContract } from './context-token-count-contract';
import type { ContextTokenCount } from './context-token-count-contract';

export const ContextTokenCountStub = ({ value }: { value?: number } = {}): ContextTokenCount =>
  contextTokenCountContract.parse(value ?? 29448);

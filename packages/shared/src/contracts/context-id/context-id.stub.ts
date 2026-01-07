import { contextIdContract } from './context-id-contract';
import type { ContextId } from './context-id-contract';

export const ContextIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): ContextId => contextIdContract.parse(value);

import { continuationContextContract } from './continuation-context-contract';
import type { ContinuationContext } from './continuation-context-contract';

export const ContinuationContextStub = (
  { value }: { value: string } = { value: 'Continue from step 2' },
): ContinuationContext => continuationContextContract.parse(value);

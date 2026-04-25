import { smoketestPlaceholderContract } from './smoketest-placeholder-contract';
import type { SmoketestPlaceholder } from './smoketest-placeholder-contract';

export const SmoketestPlaceholderStub = (
  { value }: { value: string } = { value: 'smoketest-placeholder' },
): SmoketestPlaceholder => smoketestPlaceholderContract.parse(value);

import { extraVerbNameContract } from './extra-verb-name-contract';
import type { ExtraVerbName } from './extra-verb-name-contract';

export const ExtraVerbNameStub = (
  { value }: { value: string } = { value: 'withNestedChain' },
): ExtraVerbName => extraVerbNameContract.parse(value);

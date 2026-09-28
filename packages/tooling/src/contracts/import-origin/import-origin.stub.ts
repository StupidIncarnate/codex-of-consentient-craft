import { importOriginContract } from './import-origin-contract';
import type { ImportOrigin } from './import-origin-contract';

export const ImportOriginStub = (
  { value }: { value: 'outside' | 'gateway' | 'repo' } = { value: 'outside' },
): ImportOrigin => importOriginContract.parse(value);

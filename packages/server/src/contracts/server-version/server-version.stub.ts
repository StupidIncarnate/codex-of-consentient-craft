import { serverVersionContract } from './server-version-contract';
import type { ServerVersion } from './server-version-contract';

export const ServerVersionStub = (
  { value }: { value: string } = { value: '0.1.0' },
): ServerVersion => serverVersionContract.parse(value);

import { devServerUrlContract } from './dev-server-url-contract';
import type { DevServerUrl } from './dev-server-url-contract';

export const DevServerUrlStub = (
  { value }: { value: string } = { value: 'http://localhost:3000' },
): DevServerUrl => devServerUrlContract.parse(value);

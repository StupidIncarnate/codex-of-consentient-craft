import { devCommandContract } from './dev-command-contract';
import type { DevCommand } from './dev-command-contract';

export const DevCommandStub = (
  { value }: { value: string } = { value: 'npm run dev' },
): DevCommand => devCommandContract.parse(value);

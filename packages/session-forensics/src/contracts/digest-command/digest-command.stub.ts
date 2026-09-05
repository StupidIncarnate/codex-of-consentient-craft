import { digestCommandContract } from './digest-command-contract';
import type { DigestCommand } from './digest-command-contract';

export const DigestCommandStub = (
  { value }: { value: string } = { value: 'summary' },
): DigestCommand => digestCommandContract.parse(value);

import { commitShaContract } from './commit-sha-contract';
import type { CommitSha } from './commit-sha-contract';

export const CommitShaStub = (
  { value }: { value: string } = { value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0' },
): CommitSha => commitShaContract.parse(value);

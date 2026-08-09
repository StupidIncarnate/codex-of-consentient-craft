import { baseBranchNameContract } from './base-branch-name-contract';
import type { BaseBranchName } from './base-branch-name-contract';

export const BaseBranchNameStub = (
  { value }: { value: string } = { value: 'main' },
): BaseBranchName => baseBranchNameContract.parse(value);

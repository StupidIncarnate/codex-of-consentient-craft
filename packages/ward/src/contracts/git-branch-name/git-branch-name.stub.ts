import { gitBranchNameContract, type GitBranchName } from './git-branch-name-contract';

export const GitBranchNameStub = ({ value }: { value: string }): GitBranchName =>
  gitBranchNameContract.parse(value);

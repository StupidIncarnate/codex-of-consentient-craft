import { repoRootCwdContract, type RepoRootCwd } from './repo-root-cwd-contract';

export const RepoRootCwdStub = ({ value }: { value: unknown }): RepoRootCwd =>
  repoRootCwdContract.parse(value);

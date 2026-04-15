import { repoRelativePathContract, type RepoRelativePath } from './repo-relative-path-contract';

export const RepoRelativePathStub = ({ value }: { value: unknown }): RepoRelativePath =>
  repoRelativePathContract.parse(value);

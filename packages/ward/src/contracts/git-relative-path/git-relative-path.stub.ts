import { gitRelativePathContract, type GitRelativePath } from './git-relative-path-contract';

export const GitRelativePathStub = ({ value }: { value: string }): GitRelativePath =>
  gitRelativePathContract.parse(value);

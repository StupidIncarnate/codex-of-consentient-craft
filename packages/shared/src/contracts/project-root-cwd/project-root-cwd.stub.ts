import { projectRootCwdContract, type ProjectRootCwd } from './project-root-cwd-contract';

export const ProjectRootCwdStub = ({ value }: { value: unknown }): ProjectRootCwd =>
  projectRootCwdContract.parse(value);

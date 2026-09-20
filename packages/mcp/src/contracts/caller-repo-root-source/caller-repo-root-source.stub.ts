import { callerRepoRootSourceContract } from './caller-repo-root-source-contract';
import type { CallerRepoRootSource } from './caller-repo-root-source-contract';

export const CallerRepoRootSourceStub = (
  { value }: { value: string } = { value: 'caller-cwd' },
): CallerRepoRootSource => callerRepoRootSourceContract.parse(value);

import { pathseekerRunStatusContract } from './pathseeker-run-status-contract';
import type { PathseekerRunStatus } from './pathseeker-run-status-contract';

export const PathseekerRunStatusStub = (
  { value }: { value: string } = { value: 'in_progress' },
): PathseekerRunStatus => pathseekerRunStatusContract.parse(value);

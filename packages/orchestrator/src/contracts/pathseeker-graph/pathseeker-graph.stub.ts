import type { StubArgument } from '@dungeonmaster/shared/@types';

import { pathseekerGraphContract } from './pathseeker-graph-contract';
import type { PathseekerGraph } from './pathseeker-graph-contract';

export const PathseekerGraphStub = ({
  ...props
}: StubArgument<PathseekerGraph> = {}): PathseekerGraph =>
  pathseekerGraphContract.parse({
    workItems: [],
    slices: [],
    ...props,
  });

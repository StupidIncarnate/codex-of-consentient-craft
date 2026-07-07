import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowBranchLabelOffsetMapContract } from './flow-branch-label-offset-map-contract';
import type { FlowBranchLabelOffsetMap } from './flow-branch-label-offset-map-contract';

export const FlowBranchLabelOffsetMapStub = (
  { ...props }: StubArgument<FlowBranchLabelOffsetMap> = { 'dec-to-left': -40, 'dec-to-down': 40 },
): FlowBranchLabelOffsetMap => flowBranchLabelOffsetMapContract.parse({ ...props });

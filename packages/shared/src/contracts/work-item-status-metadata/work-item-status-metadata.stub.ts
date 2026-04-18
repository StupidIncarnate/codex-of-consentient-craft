import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  workItemStatusMetadataContract,
  type WorkItemStatusMetadata,
} from './work-item-status-metadata-contract';

export const WorkItemStatusMetadataStub = ({
  ...props
}: StubArgument<WorkItemStatusMetadata> = {}): WorkItemStatusMetadata =>
  workItemStatusMetadataContract.parse({
    isTerminal: false,
    satisfiesDependency: false,
    isActive: false,
    isPending: false,
    isComplete: false,
    isSkipped: false,
    isFailure: false,
    ...props,
  });

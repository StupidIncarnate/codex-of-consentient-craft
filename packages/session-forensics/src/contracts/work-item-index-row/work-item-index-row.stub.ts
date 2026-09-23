import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workItemIndexRowContract, type WorkItemIndexRow } from './work-item-index-row-contract';

export const WorkItemIndexRowStub = ({
  ...props
}: StubArgument<WorkItemIndexRow> = {}): WorkItemIndexRow =>
  workItemIndexRowContract.parse({
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    role: 'codeweaver',
    status: 'complete',
    transcriptSizeBytes: 0,
    subagentCount: 0,
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workPlanFileEntryContract } from './work-plan-file-entry-contract';
import type { WorkPlanFileEntry } from './work-plan-file-entry-contract';

export const WorkPlanFileEntryStub = ({
  ...props
}: StubArgument<WorkPlanFileEntry> = {}): WorkPlanFileEntry =>
  workPlanFileEntryContract.parse({
    path: './packages/web/src/widgets/comment-badge/comment-badge-widget.tsx',
    change: 'new',
    in: '{ count: number }',
    out: 'ReactElement',
    ...props,
  });

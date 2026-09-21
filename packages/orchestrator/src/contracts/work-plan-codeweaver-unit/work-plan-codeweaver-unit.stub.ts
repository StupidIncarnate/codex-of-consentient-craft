import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workPlanCodeweaverUnitContract } from './work-plan-codeweaver-unit-contract';
import type { WorkPlanCodeweaverUnit } from './work-plan-codeweaver-unit-contract';

export const WorkPlanCodeweaverUnitStub = ({
  ...props
}: StubArgument<WorkPlanCodeweaverUnit> = {}): WorkPlanCodeweaverUnit =>
  workPlanCodeweaverUnitContract.parse({
    unitId: 'send-flow:observable:check-badge-count-text',
    kind: 'observable',
    observableType: 'ui-state',
    text: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
    assert: 'render the widget with two persisted comments and read the badge text',
    failsIf: 'the badge reads 0 while two comments are persisted',
    ...props,
  });

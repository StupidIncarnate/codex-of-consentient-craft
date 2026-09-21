import type { StubArgument } from '@dungeonmaster/shared/@types';

import { WorkPlanBatchStub } from '../work-plan-batch/work-plan-batch.stub';

import { workPlanFieldsContract } from './work-plan-fields-contract';
import type { WorkPlanFields } from './work-plan-fields-contract';

export const WorkPlanFieldsStub = ({
  ...props
}: StubArgument<WorkPlanFields> = {}): WorkPlanFields =>
  workPlanFieldsContract.parse({
    operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
    family: 'codeweaver',
    flowId: 'send-flow',
    packageNames: ['@dungeonmaster/web'],
    writtenBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    writtenAt: '2026-01-01T00:00:00.000Z',
    batches: [WorkPlanBatchStub()],
    plannerMarks: [],
    ...props,
  });

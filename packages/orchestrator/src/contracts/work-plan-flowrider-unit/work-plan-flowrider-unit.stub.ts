import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workPlanFlowriderUnitContract } from './work-plan-flowrider-unit-contract';
import type { WorkPlanFlowriderUnit } from './work-plan-flowrider-unit-contract';

export const WorkPlanFlowriderUnitStub = ({
  ...props
}: StubArgument<WorkPlanFlowriderUnit> = {}): WorkPlanFlowriderUnit =>
  workPlanFlowriderUnitContract.parse({
    unitId: 'send-flow:terminal:batch-sent',
    kind: 'terminal',
    layer: 'browser',
    observableTarget: { target: 'node', nodeId: 'batch-sent' },
    assert: 'the queue panel renders zero rows once the send resolves',
    failsIf: 'the panel still renders the sent rows',
    ...props,
  });

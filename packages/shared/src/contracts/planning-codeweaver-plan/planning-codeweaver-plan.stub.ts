import type { StubArgument } from '@dungeonmaster/shared/@types';

import { planningCodeweaverPlanContract } from './planning-codeweaver-plan-contract';
import type { PlanningCodeweaverPlan } from './planning-codeweaver-plan-contract';

export const PlanningCodeweaverPlanStub = ({
  ...props
}: StubArgument<PlanningCodeweaverPlan> = {}): PlanningCodeweaverPlan =>
  planningCodeweaverPlanContract.parse({
    id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    sliceName: 'web',
    logicPlan: [],
    delegations: [],
    rationale: [],
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

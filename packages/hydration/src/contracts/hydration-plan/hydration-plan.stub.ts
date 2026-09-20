import type { StubArgument } from '@dungeonmaster/shared/@types';
import { hydrationPlanContract } from './hydration-plan-contract';
import type { HydrationPlan } from './hydration-plan-contract';
import { OpCreateStub } from '../op-create/op-create.stub';

export const HydrationPlanStub = ({ ...props }: StubArgument<HydrationPlan> = {}): HydrationPlan =>
  hydrationPlanContract.parse({
    recipeName: 'guild-mid-execution',
    ops: [OpCreateStub()],
    ...props,
  });

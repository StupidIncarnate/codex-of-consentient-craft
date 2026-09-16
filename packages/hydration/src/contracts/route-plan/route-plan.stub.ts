import type { StubArgument } from '@dungeonmaster/shared/@types';
import { routePlanContract } from './route-plan-contract';
import type { RoutePlan } from './route-plan-contract';

export const RoutePlanStub = ({ ...props }: StubArgument<RoutePlan> = {}): RoutePlan =>
  routePlanContract.parse({
    guild: 'write',
    ...props,
  });

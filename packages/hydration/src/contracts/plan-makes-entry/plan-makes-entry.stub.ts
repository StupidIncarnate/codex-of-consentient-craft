import type { StubArgument } from '@dungeonmaster/shared/@types';
import { planMakesEntryContract } from './plan-makes-entry-contract';
import type { PlanMakesEntry } from './plan-makes-entry-contract';

export const PlanMakesEntryStub = ({
  ...props
}: StubArgument<PlanMakesEntry> = {}): PlanMakesEntry =>
  planMakesEntryContract.parse({
    ingredient: 'quest',
    count: 3,
    ...props,
  });

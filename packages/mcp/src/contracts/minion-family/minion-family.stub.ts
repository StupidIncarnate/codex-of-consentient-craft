import { minionFamilyContract } from './minion-family-contract';
import type { MinionFamily } from './minion-family-contract';

export const MinionFamilyStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'planner',
  },
): MinionFamily => minionFamilyContract.parse(value);

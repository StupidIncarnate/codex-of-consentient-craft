import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questPhaseContract } from './quest-phase-contract';
import type { QuestPhase } from './quest-phase-contract';

export const QuestPhaseStub = ({ ...props }: StubArgument<QuestPhase> = {}): QuestPhase =>
  questPhaseContract.parse({
    status: 'pending',
    ...props,
  });

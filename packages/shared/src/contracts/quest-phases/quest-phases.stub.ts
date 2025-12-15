import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questPhasesContract } from './quest-phases-contract';
import type { QuestPhases } from './quest-phases-contract';

export const QuestPhasesStub = ({ ...props }: StubArgument<QuestPhases> = {}): QuestPhases =>
  questPhasesContract.parse({
    discovery: { status: 'pending' },
    implementation: { status: 'pending' },
    testing: { status: 'pending' },
    review: { status: 'pending' },
    ...props,
  });

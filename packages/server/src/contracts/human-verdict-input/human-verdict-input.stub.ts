import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { humanVerdictInputContract } from './human-verdict-input-contract';
import type { HumanVerdictInput } from './human-verdict-input-contract';

export const HumanVerdictInputStub = ({
  ...props
}: StubArgument<HumanVerdictInput> = {}): HumanVerdictInput =>
  humanVerdictInputContract.parse({
    questId: QuestIdStub({ value: 'add-auth' }),
    unitId: 'motion-feels-smooth',
    outcome: 'met',
    reason: 'Watched run_7/walk.webm end to end — the transition never stutters.',
    ...props,
  });

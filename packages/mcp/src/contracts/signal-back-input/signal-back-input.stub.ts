import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { signalBackInputContract } from './signal-back-input-contract';
import type { SignalBackInput } from './signal-back-input-contract';

export const SignalBackInputStub = ({ ...props }: StubArgument<SignalBackInput> = {}): SignalBackInput =>
  signalBackInputContract.parse({
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    signal: 'complete',
    summary: 'Step completed successfully',
    ...props,
  });

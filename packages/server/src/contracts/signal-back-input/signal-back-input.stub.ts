import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import { signalBackInputContract } from './signal-back-input-contract';
import type { SignalBackInput } from './signal-back-input-contract';

export const SignalBackInputStub = ({
  ...props
}: StubArgument<SignalBackInput> = {}): SignalBackInput =>
  signalBackInputContract.parse({
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    signal: 'complete',
    ...props,
  });

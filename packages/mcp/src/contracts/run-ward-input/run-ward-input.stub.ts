import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { runWardInputContract } from './run-ward-input-contract';
import type { RunWardInput } from './run-ward-input-contract';

export const RunWardInputStub = ({ ...props }: StubArgument<RunWardInput> = {}): RunWardInput =>
  runWardInputContract.parse({
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
    mode: 'changed',
    ...props,
  });

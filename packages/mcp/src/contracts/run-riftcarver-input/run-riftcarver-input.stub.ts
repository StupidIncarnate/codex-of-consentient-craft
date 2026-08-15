import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { runRiftcarverInputContract } from './run-riftcarver-input-contract';
import type { RunRiftcarverInput } from './run-riftcarver-input-contract';

export const RunRiftcarverInputStub = ({
  ...props
}: StubArgument<RunRiftcarverInput> = {}): RunRiftcarverInput =>
  runRiftcarverInputContract.parse({
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questRunRiftcarverResultContract } from './quest-run-riftcarver-result-contract';
import type { QuestRunRiftcarverResult } from './quest-run-riftcarver-result-contract';

export const QuestRunRiftcarverResultStub = ({
  ...props
}: StubArgument<QuestRunRiftcarverResult> = {}): QuestRunRiftcarverResult =>
  questRunRiftcarverResultContract.parse({
    success: true,
    questId: 'add-auth',
    workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    exitCode: 0,
    riftcarverResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    outcome: 'green',
    ...props,
  });

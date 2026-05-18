import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questRunWardResultContract } from './quest-run-ward-result-contract';
import type { QuestRunWardResult } from './quest-run-ward-result-contract';

export const QuestRunWardResultStub = ({
  ...props
}: StubArgument<QuestRunWardResult> = {}): QuestRunWardResult =>
  questRunWardResultContract.parse({
    success: true,
    questId: 'add-auth',
    workItemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    exitCode: 0,
    wardResultId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ...props,
  });

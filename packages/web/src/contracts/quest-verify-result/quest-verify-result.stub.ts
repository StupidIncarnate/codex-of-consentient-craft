import type { StubArgument } from '@dungeonmaster/shared/@types';

import { QuestVerifyCheckStub } from '../quest-verify-check/quest-verify-check.stub';

import { questVerifyResultContract } from './quest-verify-result-contract';
import type { QuestVerifyResult } from './quest-verify-result-contract';

export const QuestVerifyResultStub = ({
  ...props
}: StubArgument<QuestVerifyResult> = {}): QuestVerifyResult =>
  questVerifyResultContract.parse({
    success: true,
    checks: [QuestVerifyCheckStub()],
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questVerifyCheckContract } from './quest-verify-check-contract';
import type { QuestVerifyCheck } from './quest-verify-check-contract';

export const QuestVerifyCheckStub = ({
  ...props
}: StubArgument<QuestVerifyCheck> = {}): QuestVerifyCheck =>
  questVerifyCheckContract.parse({
    name: 'dependency-graph',
    passed: true,
    ...props,
  });

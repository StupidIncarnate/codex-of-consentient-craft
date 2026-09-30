import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questGetServerConfigResultContract } from './quest-get-server-config-result-contract';
import type { QuestGetServerConfigResult } from './quest-get-server-config-result-contract';

export const QuestGetServerConfigResultStub = ({
  ...props
}: StubArgument<QuestGetServerConfigResult> = {}): QuestGetServerConfigResult =>
  questGetServerConfigResultContract.parse({
    baseUrl: 'http://dungeonmaster.localhost:3737',
    port: 3737,
    ...props,
  });

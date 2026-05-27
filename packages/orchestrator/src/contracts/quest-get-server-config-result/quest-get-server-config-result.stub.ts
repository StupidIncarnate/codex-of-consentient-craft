import type { StubArgument } from '@dungeonmaster/shared/@types';
import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { questGetServerConfigResultContract } from './quest-get-server-config-result-contract';
import type { QuestGetServerConfigResult } from './quest-get-server-config-result-contract';

export const QuestGetServerConfigResultStub = ({
  ...props
}: StubArgument<QuestGetServerConfigResult> = {}): QuestGetServerConfigResult =>
  questGetServerConfigResultContract.parse({
    baseUrl: 'http://dungeonmaster.localhost:3737',
    port: NetworkPortStub({ value: 3737 }),
    ...props,
  });

import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questCwdResolutionContract } from './quest-cwd-resolution-contract';
import type { QuestCwdResolution } from './quest-cwd-resolution-contract';

export const QuestCwdResolutionStub = ({
  ...props
}: StubArgument<QuestCwdResolution> = {}): QuestCwdResolution =>
  questCwdResolutionContract.parse({
    kind: 'repo-root',
    cwd: '/test/repo/root',
    ...props,
  });

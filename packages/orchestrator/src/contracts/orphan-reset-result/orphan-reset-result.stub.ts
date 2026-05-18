import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orphanResetResultContract } from './orphan-reset-result-contract';
import type { OrphanResetResult } from './orphan-reset-result-contract';

export const OrphanResetResultStub = ({
  ...props
}: StubArgument<OrphanResetResult> = {}): OrphanResetResult =>
  orphanResetResultContract.parse({
    orphansReset: 0,
    ...props,
  });

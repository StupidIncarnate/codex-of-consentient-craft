import type { z } from '#gateway/npm/zod';

import { lockReleaseOutcomeContract } from './lock-release-outcome-contract';
import type { LockReleaseOutcome } from './lock-release-outcome-contract';

type LockReleaseOutcomeInput = z.input<typeof lockReleaseOutcomeContract>;

export const LockReleaseOutcomeStub = ({
  value,
}: { value?: LockReleaseOutcomeInput } = {}): LockReleaseOutcome =>
  lockReleaseOutcomeContract.parse(value ?? 'none-held');

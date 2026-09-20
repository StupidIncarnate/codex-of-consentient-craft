import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { bootPollOutcomeContract } from './boot-poll-outcome-contract';
import type { BootPollOutcome } from './boot-poll-outcome-contract';

// One complete, minimal-but-valid default PER MEMBER — every member is `.strict()`, so a shared
// base carrying `message` would leave that field on the 'ready'/'timeout' members and the parse
// would reject it as an unrecognized key instead of building the requested member.
const BOOT_POLL_OUTCOME_DEFAULTS = {
  ready: { status: 'ready' },
  timeout: { status: 'timeout' },
  failed: { status: 'failed', message: ContentTextStub() },
} as const satisfies Record<BootPollOutcome['status'], Record<string, unknown>>;

export const BootPollOutcomeStub = ({
  ...props
}: StubArgument<BootPollOutcome> = {}): BootPollOutcome => {
  // `StubArgument` unbrands every literal, so `props.status` reads as plain `string` here — a
  // chained comparison (rather than an object index) is what resolves the right default without
  // an `any`-typed lookup, mirroring `step.stub.ts`'s own discriminated-union stub.
  const status = props.status ?? 'ready';
  const base =
    status === 'timeout'
      ? BOOT_POLL_OUTCOME_DEFAULTS.timeout
      : status === 'failed'
        ? BOOT_POLL_OUTCOME_DEFAULTS.failed
        : BOOT_POLL_OUTCOME_DEFAULTS.ready;

  return bootPollOutcomeContract.parse({ ...base, ...props });
};

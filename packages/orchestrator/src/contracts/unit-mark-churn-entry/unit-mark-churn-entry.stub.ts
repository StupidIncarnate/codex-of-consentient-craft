import type { StubArgument } from '@dungeonmaster/shared/@types';

import { unitMarkChurnEntryContract } from './unit-mark-churn-entry-contract';
import type { UnitMarkChurnEntry } from './unit-mark-churn-entry-contract';

export const UnitMarkChurnEntryStub = ({
  ...props
}: StubArgument<UnitMarkChurnEntry> = {}): UnitMarkChurnEntry =>
  unitMarkChurnEntryContract.parse({
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    step: 'work',
    mark: 'met',
    evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
    toSettle: null,
    at: '2026-01-01T00:00:00.000Z',
    ...props,
  });

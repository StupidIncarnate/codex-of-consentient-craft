import type { StubArgument } from '@dungeonmaster/shared/@types';

import { unitCurrentMarkContract } from './unit-current-mark-contract';
import type { UnitCurrentMark } from './unit-current-mark-contract';

export const UnitCurrentMarkStub = ({
  ...props
}: StubArgument<UnitCurrentMark> = {}): UnitCurrentMark =>
  unitCurrentMarkContract.parse({
    unitId: 'send-flow:observable:check-badge-count-text',
    mark: 'met',
    evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    step: 'work',
    at: '2026-01-01T00:00:00.000Z',
    ...props,
  });

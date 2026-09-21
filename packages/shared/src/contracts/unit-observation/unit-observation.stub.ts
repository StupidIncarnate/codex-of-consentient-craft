import type { StubArgument } from '@dungeonmaster/shared/@types';

import { unitObservationContract } from './unit-observation-contract';
import type { UnitObservation } from './unit-observation-contract';

export const UnitObservationStub = ({
  ...props
}: StubArgument<UnitObservation> = {}): UnitObservation =>
  unitObservationContract.parse({
    unitId: 'send-flow:observable:check-badge-count-text',
    mark: 'met',
    evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
    at: '2026-01-01T00:00:00.000Z',
    ...props,
  });

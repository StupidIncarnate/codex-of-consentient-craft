import type { StubArgument } from '@dungeonmaster/shared/@types';

import { unitObservationFieldsContract } from './unit-observation-fields-contract';
import type { UnitObservationFields } from './unit-observation-fields-contract';

export const UnitObservationFieldsStub = ({
  ...props
}: StubArgument<UnitObservationFields> = {}): UnitObservationFields =>
  unitObservationFieldsContract.parse({
    unitId: 'send-flow:observable:check-badge-count-text',
    mark: 'met',
    evidence: 'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
    at: '2026-01-01T00:00:00.000Z',
    ...props,
  });

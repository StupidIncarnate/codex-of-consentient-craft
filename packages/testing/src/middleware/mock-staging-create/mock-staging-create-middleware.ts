/**
 * PURPOSE: Wires the realm-safe native-error check into mockStagingCreateTransformer. A
 * transformer may not import a node builtin, so `isNativeError` (util/types)
 * cannot reach it directly — this middleware is the channel: jestRegisterMockAdapter and
 * jestRegisterSpyOnAdapter can import middleware, and middleware can import a gateway and
 * transformers.
 *
 * USAGE:
 * const staging = mockStagingCreateMiddleware({ record });
 * staging.rejects(crossRealmError);
 * // record.impl rejects with crossRealmError itself, not a re-wrapped same-realm Error
 */

import { isNativeError } from '#gateway/node/util__types';
import type { MockStaging } from '../../contracts/mock-staging/mock-staging-contract';
import type { StagedCall } from '../../contracts/staged-call/staged-call-contract';
import { mockStagingCreateTransformer } from '../../transformers/mock-staging-create/mock-staging-create-transformer';

export const mockStagingCreateMiddleware = ({ record }: { record: StagedCall }): MockStaging =>
  mockStagingCreateTransformer({
    record,
    isNativeError: (value: unknown): value is Error => isNativeError(value),
  });

/**
 * PURPOSE: Reports whether a value is a genuine, engine-constructed Error — safe across a Jest vm
 * realm boundary, where `value instanceof Error` FAILS for an error Node's own internals raised
 * outside that boundary even though the value genuinely is one (packages/orchestrator's
 * guild-config-read-broker.ts documents the same cross-realm failure, worked around there only by
 * keeping the affected branch out of its tests — this adapter fixes the check itself).
 * `util/types`' `isNativeError` inspects the V8-internal error slot rather than walking the
 * prototype chain, so it answers correctly whichever realm constructed the value. Reach for this
 * over `value instanceof Error` in any catch classifying an error a real (non-mocked) I/O call may
 * have raised — `fs/promises` and friends throw errors built by Node's own internals, which run
 * outside the vm context a Jest test file executes in.
 *
 * USAGE:
 * errorIsNativeErrorAdapter({ value: new Error('boom') });
 * // Returns true
 *
 * errorIsNativeErrorAdapter({ value: { message: 'not an error' } });
 * // Returns false
 */

import { isNativeError } from 'util/types';

export const errorIsNativeErrorAdapter = ({ value }: { value: unknown }): boolean =>
  isNativeError(value);

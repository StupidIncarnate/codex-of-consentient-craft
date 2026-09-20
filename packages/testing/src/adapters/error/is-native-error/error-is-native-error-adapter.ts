/**
 * PURPOSE: Reports whether a value is a genuine, engine-constructed Error — safe across a Jest vm
 * realm boundary, where `value instanceof Error` FAILS for an error Node's own internals raised
 * outside that boundary even though the value genuinely is one. `util/types`' `isNativeError`
 * inspects the V8-internal error slot rather than walking the prototype chain, so it answers
 * correctly whichever realm constructed the value. `mockStagingCreateMiddleware` is the one legal
 * channel that hands this to `mockStagingCreateTransformer` — a transformer may not import a node
 * builtin, so the check lives here instead.
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

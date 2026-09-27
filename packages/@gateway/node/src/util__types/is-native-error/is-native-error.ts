/**
 * PURPOSE: Isolates the one call to the deprecated `util.types.isNativeError` in this file, so
 * every caller reaches this wrapper's own, undeprecated type instead of triggering `no-deprecated`
 * at each call site. Realm-safe: `value instanceof Error` is false for an error Node's own
 * internals construct outside the vm realm a Jest test runs inside, even though the value
 * genuinely is one — this inspects the V8-internal error slot instead, which answers correctly
 * whichever realm constructed the value. `Error.isError`, the non-deprecated replacement Node
 * docs point to, is not in this repo's pinned `@types/node`.
 *
 * USAGE:
 * isNativeError(new Error('boom'));
 * // Returns true
 * isNativeError({ message: 'not an error' });
 * // Returns false
 */
import { isNativeError as isNativeErrorFromUtilTypes } from 'util/types';

// The return type stays the same type predicate (`value is Error`) Node's own declaration
// carries — callers narrow on it the same way they narrowed on the raw import, and a caller
// reading `.message` off a value only this predicate confirmed is an Error still typechecks.
export const isNativeError = (value: unknown): value is Error => isNativeErrorFromUtilTypes(value);

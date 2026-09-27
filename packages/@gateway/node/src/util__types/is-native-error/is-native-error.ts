/**
 * PURPOSE: Reports whether a value is a genuine, engine-constructed `Error`, realm-safe:
 * `value instanceof Error` is false for an error Node's own internals construct outside the vm
 * realm a Jest test runs inside, even though the value genuinely is one. `util.types.isNativeError`
 * answers this correctly too, but is deprecated, and a consumer's own newer `@typescript-eslint`
 * flags every reference to it with `no-deprecated` — including a wrapper file built only to isolate
 * that one call, which defeats the isolation. `Object.prototype.toString.call(value)` answers the
 * identical question through the ECMAScript spec's own built-in-tag mechanism (an object with an
 * internal `[[ErrorData]]` slot reports `'[object Error]'` unless it overrides `Symbol.toStringTag`
 * itself), which is realm-safe for the same reason `isNativeError` was — it inspects an
 * engine-level slot, not the prototype chain `instanceof` walks — while never referencing the
 * deprecated symbol at all.
 *
 * USAGE:
 * isNativeError(new Error('boom'));
 * // Returns true
 * isNativeError({ message: 'not an error' });
 * // Returns false
 */

const NATIVE_ERROR_TAG = '[object Error]';

// The return type is the same type predicate (`value is Error`) `util.types.isNativeError` carried
// — callers narrow on it the same way, and a caller reading `.message` off a value only this
// predicate confirmed is an Error still typechecks.
export const isNativeError = (value: unknown): value is Error =>
  Object.prototype.toString.call(value) === NATIVE_ERROR_TAG;

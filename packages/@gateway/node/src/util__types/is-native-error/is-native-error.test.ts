import { runInNewContext } from 'vm';

import { isNativeError } from './is-native-error';
import { isNativeErrorProxy } from './is-native-error.proxy';

describe('isNativeError', () => {
  it('VALID: {value: an Error constructed in this realm} => returns true', () => {
    isNativeErrorProxy();

    expect(isNativeError(new Error('boom'))).toBe(true);
  });

  it('VALID: {value: a TypeError constructed in this realm} => returns true', () => {
    isNativeErrorProxy();

    expect(isNativeError(new TypeError('boom'))).toBe(true);
  });

  // `vm.runInNewContext` constructs the Error using a DIFFERENT realm's Error constructor, the
  // same way Node's own `fs/promises` internals construct an error outside the vm context a Jest
  // test file runs inside. Plain `instanceof Error` returns false against this value;
  // `isNativeError` must not.
  it('VALID: {value: an Error constructed in a different vm realm} => returns true', () => {
    isNativeErrorProxy();
    const crossRealmError: unknown = runInNewContext('new Error("boom")');

    expect(crossRealmError instanceof Error).toBe(false);
    expect(isNativeError(crossRealmError)).toBe(true);
  });

  it('INVALID: {value: a plain object carrying an error-shaped message} => returns false', () => {
    isNativeErrorProxy();

    expect(isNativeError({ message: 'boom', code: 'EEXIST' })).toBe(false);
  });

  it('INVALID: {value: a string} => returns false', () => {
    isNativeErrorProxy();

    expect(isNativeError('boom')).toBe(false);
  });

  it('EMPTY: {value: null} => returns false', () => {
    isNativeErrorProxy();

    expect(isNativeError(null)).toBe(false);
  });

  it('EMPTY: {value: undefined} => returns false', () => {
    isNativeErrorProxy();

    expect(isNativeError(undefined)).toBe(false);
  });

  // The DOMException a fetch abort rejects with is not a native V8 error, in any realm —
  // isNativeError inspects the V8-internal error slot directly rather than calling a getter on the
  // value, so it is unaffected by realm binding and correctly reports false either way.
  it('EDGE: {value: a DOMException} => returns false', () => {
    isNativeErrorProxy();
    const abortReason = new DOMException('The operation was aborted', 'AbortError');

    expect(isNativeError(abortReason)).toBe(false);
  });
});

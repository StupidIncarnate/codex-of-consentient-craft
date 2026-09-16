import { runInNewContext } from 'vm';

import { errorIsNativeErrorAdapter } from './error-is-native-error-adapter';
import { errorIsNativeErrorAdapterProxy } from './error-is-native-error-adapter.proxy';

describe('errorIsNativeErrorAdapter', () => {
  it('VALID: {value: an Error constructed in this realm} => returns true', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: new Error('boom') })).toBe(true);
  });

  it('VALID: {value: a TypeError constructed in this realm} => returns true', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: new TypeError('boom') })).toBe(true);
  });

  // Reproduces the exact failure this adapter exists to fix: `vm.runInNewContext` constructs the
  // Error using a DIFFERENT realm's Error constructor, the same way Node's own `fs/promises`
  // internals construct an error outside the vm context a Jest test file runs inside. Plain
  // `instanceof Error` returns false against this value (packages/orchestrator's
  // guild-config-read-broker.ts documents the same failure); `errorIsNativeErrorAdapter` must not.
  it('VALID: {value: an Error constructed in a different vm realm} => returns true', () => {
    errorIsNativeErrorAdapterProxy();
    const crossRealmError: unknown = runInNewContext('new Error("boom")');

    expect(crossRealmError instanceof Error).toBe(false);
    expect(errorIsNativeErrorAdapter({ value: crossRealmError })).toBe(true);
  });

  it('INVALID: {value: a plain object carrying an error-shaped message} => returns false', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: { message: 'boom', code: 'EEXIST' } })).toBe(false);
  });

  it('INVALID: {value: a string} => returns false', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: 'boom' })).toBe(false);
  });

  it('EMPTY: {value: null} => returns false', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: null })).toBe(false);
  });

  it('EMPTY: {value: undefined} => returns false', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: undefined })).toBe(false);
  });
});

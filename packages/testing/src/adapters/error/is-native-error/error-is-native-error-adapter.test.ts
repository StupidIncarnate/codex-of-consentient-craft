import { runInNewContext } from 'vm';

import { errorIsNativeErrorAdapter } from './error-is-native-error-adapter';
import { errorIsNativeErrorAdapterProxy } from './error-is-native-error-adapter.proxy';
import { StagedCallStub } from '../../../contracts/staged-call/staged-call.stub';
import { mockStagingCreateTransformer } from '../../../transformers/mock-staging-create/mock-staging-create-transformer';

describe('errorIsNativeErrorAdapter', () => {
  it('VALID: {value: an Error constructed in this realm} => returns true', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: new Error('boom') })).toBe(true);
  });

  it('VALID: {value: a TypeError constructed in this realm} => returns true', () => {
    errorIsNativeErrorAdapterProxy();

    expect(errorIsNativeErrorAdapter({ value: new TypeError('boom') })).toBe(true);
  });

  // `vm.runInNewContext` constructs the Error using a DIFFERENT realm's Error constructor, the
  // same way Node's own `fs/promises` internals construct an error outside the vm context a Jest
  // test file runs inside. Plain `instanceof Error` returns false against this value;
  // `errorIsNativeErrorAdapter` must not.
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

  // The DOMException a fetch abort rejects with is not a native V8 error, in any realm —
  // isNativeError inspects the V8-internal error slot directly rather than calling a getter on the
  // value, so it is unaffected by realm binding and correctly reports false either way.
  it('EDGE: {value: a DOMException} => returns false', () => {
    errorIsNativeErrorAdapterProxy();
    const abortReason = new DOMException('The operation was aborted', 'AbortError');

    expect(errorIsNativeErrorAdapter({ value: abortReason })).toBe(false);
  });
});

// Full-pipeline proof: this is the same wiring mockStagingCreateMiddleware does in production
// (errorIsNativeErrorAdapter feeding mockStagingCreateTransformer's isNativeError parameter),
// written out directly because a transformer needs no proxy and this is the one file in the chain
// allowed to import `vm` to build a genuine cross-realm value. mock-staging-create-middleware.test
// covers the same wiring without `vm`, which middleware/ may not import.
describe('mockStagingCreateTransformer wired to the real errorIsNativeErrorAdapter', () => {
  // This is the assertion that proves the fix: before it, a cross-realm rejection reached
  // record.impl() re-wrapped into a same-realm Error carrying "Error: boom" as its message,
  // losing the original error's identity, .stack and any extra properties (e.g. .code).
  it('VALID: {rejects: a cross-realm Error} => record.impl rejects with that same error instance', async () => {
    errorIsNativeErrorAdapterProxy();
    const record = StagedCallStub();
    const staging = mockStagingCreateTransformer({
      record,
      isNativeError: (value: unknown): value is Error => errorIsNativeErrorAdapter({ value }),
    });
    const crossRealmError: unknown = runInNewContext('new Error("boom")');

    staging.rejects(crossRealmError);

    await expect(record.impl()).rejects.toBe(crossRealmError);
  });
});

import { StagedCallStub } from '../../contracts/staged-call/staged-call.stub';
import { mockStagingCreateTransformer } from './mock-staging-create-transformer';

const alwaysNativeError = (_value: unknown): _value is Error => true;
const neverNativeError = (_value: unknown): _value is Error => false;

describe('mockStagingCreateTransformer', () => {
  describe('returns', () => {
    it('VALID: {returns: 42} => record.impl returns the value', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });

      staging.returns(42);

      expect(record.impl()).toBe(42);
    });
  });

  describe('resolves', () => {
    it('VALID: {resolves: "quest-json"} => record.impl resolves the value', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });

      staging.resolves('quest-json');

      await expect(record.impl()).resolves.toBe('quest-json');
    });
  });

  describe('rejects', () => {
    it('VALID: {rejects: Error instance} => record.impl rejects with that message', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });

      staging.rejects(new Error('ENOENT'));

      await expect(record.impl()).rejects.toThrow(/^ENOENT$/u);
    });

    it('VALID: {rejects: non-Error value} => record.impl rejects with the stringified value as the message', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });

      staging.rejects(42);

      await expect(record.impl()).rejects.toThrow(/^42$/u);
    });

    // Proves the transformer trusts an injected isNativeError over `instanceof Error` — the real
    // predicate (errorIsNativeErrorAdapter, wired in by mockStagingCreateMiddleware) answers true
    // for a cross-realm Error that `instanceof Error` here would answer false for. This test stays
    // at the pure-logic level with a fake predicate and a plain (non-Error) value; the real
    // cross-realm value (built with `vm.runInNewContext`) is exercised in
    // error-is-native-error-adapter.test.ts, the one file in this chain allowed to import a node
    // builtin.
    it('VALID: {rejects: a plain value, isNativeError: true} => record.impl rejects with that same value unwrapped', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: alwaysNativeError });
      const fakeNativeValue = 'not-really-an-error';

      staging.rejects(fakeNativeValue);

      await expect(record.impl()).rejects.toBe(fakeNativeValue);
    });

    // A same-realm Error subclass instance (a DOMException stand-in) that isNativeError reports
    // false for must still pass through unchanged via the `instanceof Error` branch, not get
    // flattened into a generic wrapped Error.
    it('VALID: {rejects: an Error subclass instance, isNativeError: false} => record.impl rejects with that same instance unwrapped', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });
      class DomExceptionStandIn extends Error {}
      const notNativeButIsError = new DomExceptionStandIn('boom');

      staging.rejects(notNativeButIsError);

      await expect(record.impl()).rejects.toBe(notNativeButIsError);
    });
  });

  describe('throws', () => {
    it('VALID: {throws: Error instance} => record.impl throws that error', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });

      staging.throws(new Error('ENOENT'));

      expect(() => record.impl()).toThrow(/^ENOENT$/u);
    });

    it('VALID: {throws: non-Error value} => record.impl throws with the stringified value as the message', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });

      staging.throws(42);

      expect(() => record.impl()).toThrow(/^42$/u);
    });
  });

  describe('implement', () => {
    it('VALID: {implement: custom fn} => record.impl delegates to the given implementation', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record, isNativeError: neverNativeError });

      staging.implement((() => 'handled') as never);

      expect(record.impl()).toBe('handled');
    });
  });
});

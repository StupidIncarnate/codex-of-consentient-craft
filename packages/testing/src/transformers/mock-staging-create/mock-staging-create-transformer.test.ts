import { StagedCallStub } from '../../contracts/staged-call/staged-call.stub';
import { mockStagingCreateTransformer } from './mock-staging-create-transformer';

describe('mockStagingCreateTransformer', () => {
  describe('returns', () => {
    it('VALID: {returns: 42} => record.impl returns the value', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record });

      staging.returns(42);

      expect(record.impl()).toBe(42);
    });
  });

  describe('resolves', () => {
    it('VALID: {resolves: "quest-json"} => record.impl resolves the value', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record });

      staging.resolves('quest-json');

      await expect(record.impl()).resolves.toBe('quest-json');
    });
  });

  describe('rejects', () => {
    it('VALID: {rejects: Error instance} => record.impl rejects with that message', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record });

      staging.rejects(new Error('ENOENT'));

      await expect(record.impl()).rejects.toThrow(/^ENOENT$/u);
    });

    it('VALID: {rejects: non-Error value} => record.impl rejects with the stringified value as the message', async () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record });

      staging.rejects(42);

      await expect(record.impl()).rejects.toThrow(/^42$/u);
    });
  });

  describe('throws', () => {
    it('VALID: {throws: Error instance} => record.impl throws that error', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record });

      staging.throws(new Error('ENOENT'));

      expect(() => record.impl()).toThrow(/^ENOENT$/u);
    });

    it('VALID: {throws: non-Error value} => record.impl throws with the stringified value as the message', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record });

      staging.throws(42);

      expect(() => record.impl()).toThrow(/^42$/u);
    });
  });

  describe('implement', () => {
    it('VALID: {implement: custom fn} => record.impl delegates to the given implementation', () => {
      const record = StagedCallStub();
      const staging = mockStagingCreateTransformer({ record });

      staging.implement((() => 'handled') as never);

      expect(record.impl()).toBe('handled');
    });
  });
});

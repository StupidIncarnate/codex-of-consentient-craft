import { openHandleFindingContract } from './open-handle-finding-contract';
import { OpenHandleFindingStub } from './open-handle-finding.stub';

describe('openHandleFindingContract', () => {
  describe('valid findings', () => {
    it('VALID: {kind: setInterval, testPath, stack} => parses to the same object', () => {
      const finding = OpenHandleFindingStub({
        kind: 'setInterval',
        testPath: 'packages/a/src/poll.test.ts',
        stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
      });

      expect(finding).toStrictEqual({
        kind: 'setInterval',
        testPath: 'packages/a/src/poll.test.ts',
        stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
      });
    });

    it('VALID: {kind: setTimeout} => parses', () => {
      const finding = OpenHandleFindingStub({ kind: 'setTimeout' });

      expect(finding.kind).toBe('setTimeout');
    });

    it('VALID: {kind: setImmediate} => parses', () => {
      const finding = OpenHandleFindingStub({ kind: 'setImmediate' });

      expect(finding.kind).toBe('setImmediate');
    });

    it('EMPTY: {stack: ""} => parses, because a stack can come back stripped', () => {
      const finding = OpenHandleFindingStub({ stack: '' });

      expect(finding.stack).toBe('');
    });
  });

  describe('invalid findings', () => {
    it('INVALID: {kind: "setTimer"} => throws', () => {
      expect(() =>
        openHandleFindingContract.parse({
          kind: 'setTimer',
          testPath: 'packages/a/src/poll.test.ts',
          stack: '',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {testPath: ""} => throws', () => {
      expect(() =>
        openHandleFindingContract.parse({ kind: 'setInterval', testPath: '', stack: '' }),
      ).toThrow(/at least 1 character/u);
    });

    it('INVALID: {stack: 42} => throws', () => {
      expect(() =>
        openHandleFindingContract.parse({
          kind: 'setInterval',
          testPath: 'packages/a/src/poll.test.ts',
          stack: 42,
        }),
      ).toThrow(/Expected string/u);
    });

    it('EMPTY: {} => throws', () => {
      expect(() => openHandleFindingContract.parse({})).toThrow(/Required/u);
    });
  });
});

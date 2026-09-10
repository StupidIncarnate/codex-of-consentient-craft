import { testingOpenHandleFindingContract } from './testing-open-handle-finding-contract';
import { TestingOpenHandleFindingStub } from './testing-open-handle-finding.stub';

describe('testingOpenHandleFindingContract', () => {
  describe('valid lines', () => {
    it('VALID: {kind, testPath, stack} => parses to the same object', () => {
      const finding = TestingOpenHandleFindingStub({
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

    it('EMPTY: {stack: ""} => parses, because a stack can come back stripped', () => {
      const finding = TestingOpenHandleFindingStub({ stack: '' });

      expect(finding.stack).toBe('');
    });

    it('VALID: {kind the producer added later} => parses, since ward does not own that list', () => {
      const finding = TestingOpenHandleFindingStub({ kind: 'setImmediate' });

      expect(finding.kind).toBe('setImmediate');
    });
  });

  describe('invalid lines', () => {
    it('EMPTY: {kind: ""} => throws', () => {
      expect(() =>
        testingOpenHandleFindingContract.parse({ kind: '', testPath: 'a.test.ts', stack: '' }),
      ).toThrow(/at least 1 character/u);
    });

    it('EMPTY: {testPath: ""} => throws', () => {
      expect(() =>
        testingOpenHandleFindingContract.parse({ kind: 'setInterval', testPath: '', stack: '' }),
      ).toThrow(/at least 1 character/u);
    });

    it('EMPTY: {} => throws', () => {
      expect(() => testingOpenHandleFindingContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {stack: 42} => throws', () => {
      expect(() =>
        testingOpenHandleFindingContract.parse({
          kind: 'setInterval',
          testPath: 'a.test.ts',
          stack: 42,
        }),
      ).toThrow(/Expected string/u);
    });
  });
});

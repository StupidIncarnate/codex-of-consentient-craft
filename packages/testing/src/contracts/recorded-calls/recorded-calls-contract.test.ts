import { recordedCallsContract } from './recorded-calls-contract';
import { RecordedCallsStub } from './recorded-calls.stub';

describe('recordedCallsContract', () => {
  describe('valid data', () => {
    it('VALID: {} => parses empty object', () => {
      const result = recordedCallsContract.parse({});

      expect(result).toStrictEqual({});
    });
  });

  describe('RecordedCallsStub', () => {
    it('VALID: {defaults} => creates RecordedCalls backed by an empty call history', () => {
      const calls = RecordedCallsStub();
      const { length } = calls;

      expect(length).toBe(0);
      expect(calls.map((call) => call)).toStrictEqual([]);
      expect(calls.filter(() => true)).toStrictEqual([]);
      expect([...calls]).toStrictEqual([]);
    });

    it('VALID: {custom map} => creates RecordedCalls with overridden method', () => {
      const customMap = <U>(): U[] => [];
      const calls = RecordedCallsStub({ map: customMap });

      expect(calls.map).toBe(customMap);
    });

    it('VALID: {custom filter} => creates RecordedCalls with overridden method', () => {
      const customFilter = (): unknown[][] => [];
      const calls = RecordedCallsStub({ filter: customFilter });

      expect(calls.filter).toBe(customFilter);
    });

    it('VALID: {custom length} => creates RecordedCalls with overridden length', () => {
      const calls = RecordedCallsStub({ length: 3 });
      const { length } = calls;

      expect(length).toBe(3);
    });

    it('VALID: {custom iterator} => creates RecordedCalls with overridden Symbol.iterator', () => {
      const customIterator = (): IterableIterator<unknown[]> => [][Symbol.iterator]();
      const calls = RecordedCallsStub({ [Symbol.iterator]: customIterator });

      expect(calls[Symbol.iterator]).toBe(customIterator);
    });
  });
});

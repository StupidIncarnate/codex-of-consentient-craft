import { filterExpectContract } from './filter-expect-contract';
import { FilterExpectStub } from './filter-expect.stub';

describe('filterExpectContract', () => {
  describe('valid filter expectations', () => {
    it('VALID: {options} => exposes exactly one, some, any', () => {
      expect(filterExpectContract.options).toStrictEqual(['one', 'some', 'any']);
    });

    it.each(filterExpectContract.options)(
      'VALID: {value: %s} => parses to itself',
      (expectValue) => {
        expect(FilterExpectStub({ value: expectValue })).toBe(expectValue);
      },
    );
  });

  describe('invalid filter expectations', () => {
    it('INVALID: {value: "exactly-two"} => throws naming the valid options', () => {
      expect(() => filterExpectContract.parse('exactly-two')).toThrow(
        /Invalid enum value\. Expected 'one' \| 'some' \| 'any', received 'exactly-two'/u,
      );
    });
  });
});

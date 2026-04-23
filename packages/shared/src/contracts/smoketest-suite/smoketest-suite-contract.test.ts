import { smoketestSuiteContract } from './smoketest-suite-contract';
import { SmoketestSuiteStub } from './smoketest-suite.stub';

describe('smoketestSuiteContract', () => {
  it.each(['all', 'mcp', 'signals', 'orchestration'] as const)(
    'VALID: {value: %s} => parses as SmoketestSuite',
    (value) => {
      expect(smoketestSuiteContract.parse(SmoketestSuiteStub({ value }))).toBe(value);
    },
  );

  it('INVALID: {value: "nope"} => throws', () => {
    expect(() => smoketestSuiteContract.parse('nope')).toThrow(/Invalid enum value/u);
  });
});

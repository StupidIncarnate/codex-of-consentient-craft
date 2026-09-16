import { compareQueryContract } from './compare-query-contract';
import { CompareQueryStub } from './compare-query.stub';

describe('compareQueryContract', () => {
  describe('valid queries', () => {
    it('VALID: {instanceId, runA: "run_4", runB: "run_5"} => parses spec line 2354 verbatim', () => {
      const query = CompareQueryStub({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
      });

      const result = compareQueryContract.parse(query);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
      });
    });
  });

  describe('rejecting a cross-instance form', () => {
    it('INVALID: {instanceA, instanceB} => throws naming the stray keys, because there is no cross-instance form', () => {
      expect(() =>
        compareQueryContract.parse({
          instanceA: 'inst_7f3a9c21',
          instanceB: 'inst_9b2c1234',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'instanceA', 'instanceB'/u);
    });
  });

  describe('invalid queries', () => {
    it('INVALID: {missing runB} => throws Required', () => {
      expect(() =>
        compareQueryContract.parse({
          instanceId: 'inst_7f3a9c21',
          runA: 'run_4',
        }),
      ).toThrow(/Required/u);
    });
  });
});

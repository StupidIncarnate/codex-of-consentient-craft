import { compareArgsContract } from './compare-args-contract';
import { CompareArgsStub } from './compare-args.stub';

describe('compareArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {instanceId, runA: "run_4", runB: "run_5"} => parses', () => {
      const args = CompareArgsStub({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
      });

      const result = compareArgsContract.parse(args);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
        json: false,
      });
    });

    it('VALID: {json: true} => parses with json: true', () => {
      const args = CompareArgsStub({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
        json: true,
      });

      const result = compareArgsContract.parse(args);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
        json: true,
      });
    });
  });

  describe('rejecting a cross-instance form', () => {
    it('INVALID: {instanceA, instanceB} => throws naming the stray keys, because there is no cross-instance form', () => {
      expect(() =>
        compareArgsContract.parse({
          instanceA: 'inst_7f3a9c21',
          instanceB: 'inst_9b2c1234',
        } as never),
      ).toThrow(/Unrecognized key\(s\) in object: 'instanceA', 'instanceB'/u);
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing runB} => raises exactly one issue, scoped to runB', () => {
      const result = compareArgsContract.safeParse({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['runB'],
          message: 'Required',
        },
      ]);
    });
  });
});

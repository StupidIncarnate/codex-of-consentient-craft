import { siegelenseCompareInputContract } from './siegelense-compare-input-contract';
import { SiegelenseCompareInputStub } from './siegelense-compare-input.stub';

describe('siegelenseCompareInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {instanceId, runA, runB} => parses successfully', () => {
      expect(siegelenseCompareInputContract.parse(SiegelenseCompareInputStub())).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runA: 'run_4',
        runB: 'run_5',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing instanceId} => throws validation error', () => {
      expect(() => siegelenseCompareInputContract.parse({ runA: 'run_4', runB: 'run_5' })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {missing runB} => throws validation error', () => {
      expect(() =>
        siegelenseCompareInputContract.parse({ instanceId: 'inst_7f3a9c21', runA: 'run_4' }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {instanceId: malformed} => throws validation error', () => {
      expect(() =>
        siegelenseCompareInputContract.parse({
          instanceId: 'not-an-instance-id',
          runA: 'run_4',
          runB: 'run_5',
        }),
      ).toThrow(/Instance id must look like/u);
    });

    it('INVALID: {instanceA, instanceB} => throws Unrecognized key, no cross-instance form accepted', () => {
      expect(() =>
        siegelenseCompareInputContract.parse({
          instanceA: 'inst_7f3a9c21',
          instanceB: 'inst_9b2c3d4e',
          runA: 'run_4',
          runB: 'run_5',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});

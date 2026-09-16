import { planRunsResultContract } from './plan-runs-result-contract';
import { PlanRunsResultStub } from './plan-runs-result.stub';

describe('planRunsResultContract', () => {
  describe('valid results', () => {
    it('VALID: {serverless: true} => returns serverless true with no needsServerFor key', () => {
      const result = PlanRunsResultStub({ serverless: true });

      expect(result).toStrictEqual({ serverless: true });
    });

    it('VALID: {serverless: false, needsServerFor: guild} => returns both', () => {
      const result = PlanRunsResultStub({ serverless: false, needsServerFor: 'guild' });

      expect(result).toStrictEqual({ serverless: false, needsServerFor: 'guild' });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {serverless: false, no needsServerFor} => throws "Required"', () => {
      expect(() => planRunsResultContract.parse({ serverless: false })).toThrow(/Required/u);
    });

    it('INVALID: {serverless: "nope"} => throws naming the invalid discriminator', () => {
      expect(() => planRunsResultContract.parse({ serverless: 'nope' })).toThrow(
        /Invalid discriminator value/u,
      );
    });
  });
});

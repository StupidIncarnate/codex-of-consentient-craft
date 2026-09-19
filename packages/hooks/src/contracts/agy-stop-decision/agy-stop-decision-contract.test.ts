import { agyStopDecisionContract } from './agy-stop-decision-contract';
import { AgyStopDecisionStub } from './agy-stop-decision.stub';

describe('agyStopDecisionContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = AgyStopDecisionStub();

    expect(result).toStrictEqual({
      decision: 'stop',
    });
  });

  it('VALID: {decision: continue, reason} => parses successfully', () => {
    const result = agyStopDecisionContract.parse({
      decision: 'continue',
      reason: 'Agent must signal-back',
    });

    expect(result).toStrictEqual({
      decision: 'continue',
      reason: 'Agent must signal-back',
    });
  });

  describe('invalid input', () => {
    it('INVALID: {decision: invalid} => throws validation error', () => {
      expect(() => {
        return agyStopDecisionContract.parse({ decision: 'invalid' } as never);
      }).toThrow(/Invalid enum value/u);
    });
  });
});

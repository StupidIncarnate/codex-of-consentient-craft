import { agyPreToolDecisionContract } from './agy-pre-tool-decision-contract';
import { AgyPreToolDecisionStub } from './agy-pre-tool-decision.stub';

describe('agyPreToolDecisionContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = AgyPreToolDecisionStub();

    expect(result).toStrictEqual({
      decision: 'allow',
    });
  });

  it('VALID: {decision: deny, reason} => parses successfully', () => {
    const result = agyPreToolDecisionContract.parse({
      decision: 'deny',
      reason: 'Blocked by quality gate',
    });

    expect(result).toStrictEqual({
      decision: 'deny',
      reason: 'Blocked by quality gate',
    });
  });

  describe('invalid input', () => {
    it('INVALID: {decision: invalid} => throws validation error', () => {
      expect(() => {
        return agyPreToolDecisionContract.parse({ decision: 'invalid' } as never);
      }).toThrow(/Invalid enum value/u);
    });
  });
});

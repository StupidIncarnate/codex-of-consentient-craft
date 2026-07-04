import { dispatchPlayGateResultContract } from './dispatch-play-gate-result-contract';
import { DispatchPlayGateResultStub } from './dispatch-play-gate-result.stub';

describe('dispatchPlayGateResultContract', () => {
  it('VALID: {allowed: true} => parses without reason', () => {
    const result = dispatchPlayGateResultContract.parse({ allowed: true });

    expect(result).toStrictEqual({ allowed: true });
  });

  it('VALID: {allowed: false, reason} => parses refusal', () => {
    const result = DispatchPlayGateResultStub({
      allowed: false,
      reason: 'A /dumpster-launch loop is active',
    });

    expect(result).toStrictEqual({
      allowed: false,
      reason: 'A /dumpster-launch loop is active',
    });
  });

  it('INVALID: {reason: ""} => throws min-length error', () => {
    expect(() => DispatchPlayGateResultStub({ allowed: false, reason: '' as never })).toThrow(
      /String must contain at least 1 character/u,
    );
  });

  it('INVALID: {allowed missing} => throws Required', () => {
    expect(() => dispatchPlayGateResultContract.parse({})).toThrow(/Required/u);
  });
});

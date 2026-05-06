import { resetDurationLabelContract } from './reset-duration-label-contract';
import { ResetDurationLabelStub } from './reset-duration-label.stub';

describe('resetDurationLabelContract', () => {
  it('VALID: stub default => parses', () => {
    expect(ResetDurationLabelStub()).toBe('2h5m');
  });

  it('VALID: {value: "4d11h"} => parses', () => {
    expect(resetDurationLabelContract.parse('4d11h')).toBe('4d11h');
  });

  it('VALID: {value: "15m"} => parses', () => {
    expect(resetDurationLabelContract.parse('15m')).toBe('15m');
  });

  it('INVALID: {value: ""} => throws', () => {
    expect(() => resetDurationLabelContract.parse('')).toThrow(/too_small/u);
  });
});

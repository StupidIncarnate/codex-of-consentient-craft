import { uptimeLabelContract } from './uptime-label-contract';
import { UptimeLabelStub } from './uptime-label.stub';

describe('uptimeLabelContract', () => {
  it('VALID: stub default => parses', () => {
    expect(UptimeLabelStub()).toBe('12m');
  });

  it('VALID: {value: "1h2m"} => parses', () => {
    expect(uptimeLabelContract.parse('1h2m')).toBe('1h2m');
  });

  it('VALID: {value: "45s"} => parses', () => {
    expect(uptimeLabelContract.parse('45s')).toBe('45s');
  });

  it('INVALID: {value: ""} => throws', () => {
    expect(() => uptimeLabelContract.parse('')).toThrow(/too_small/u);
  });
});

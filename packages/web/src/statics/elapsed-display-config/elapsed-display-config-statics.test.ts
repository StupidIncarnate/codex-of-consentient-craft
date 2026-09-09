import { elapsedDisplayConfigStatics } from './elapsed-display-config-statics';

describe('elapsedDisplayConfigStatics', () => {
  it('VALID: {default} => refresh.tickMs is 60_000', () => {
    expect(elapsedDisplayConfigStatics.refresh.tickMs).toBe(60_000);
  });

  it('VALID: {default} => thresholds.minuteThresholdSeconds is 60', () => {
    expect(elapsedDisplayConfigStatics.thresholds.minuteThresholdSeconds).toBe(60);
  });

  it('VALID: {default} => thresholds.hourThresholdMinutes is 60', () => {
    expect(elapsedDisplayConfigStatics.thresholds.hourThresholdMinutes).toBe(60);
  });
});

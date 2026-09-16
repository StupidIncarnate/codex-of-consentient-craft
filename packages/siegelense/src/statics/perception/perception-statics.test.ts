import { perceptionStatics } from './perception-statics';

describe('perceptionStatics', () => {
  it('VALID: exported value => matches the complete expected shape', () => {
    expect(perceptionStatics).toStrictEqual({
      blank: {
        channelTolerance: 4,
        sampleStride: 7,
      },
      pixelChange: {
        openThresholdPercent: 30,
        percentSuffix: '%',
      },
      diff: {
        yiqThreshold: 0.1,
      },
      channel: {
        maxValue: 255,
      },
    });
  });

  it('VALID: {openThresholdPercent} => is 30, per siegelense-tooling.md line 704', () => {
    expect(perceptionStatics.pixelChange.openThresholdPercent).toBe(30);
  });

  it('VALID: {channel.maxValue} => is 255, the full range of one 8-bit RGB channel', () => {
    expect(perceptionStatics.channel.maxValue).toBe(255);
  });
});

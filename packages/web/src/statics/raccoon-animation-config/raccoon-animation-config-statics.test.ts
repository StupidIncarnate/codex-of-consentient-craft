import { raccoonAnimationConfigStatics } from './raccoon-animation-config-statics';

describe('raccoonAnimationConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(raccoonAnimationConfigStatics).toStrictEqual({
      idleIntervalMs: 2000,
      thinkingIntervalMs: 500,
      toolCallIntervalMs: 300,
      bounceOffsetPx: -4,
      bounceRestPx: 0,
      scrollThresholdPx: 10,
    });
  });
});

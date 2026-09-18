import { videoStatics } from './video-statics';

describe('videoStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(videoStatics).toStrictEqual({
      actions: ['start', 'stop'],
      readings: {
        started: 'video recording started',
        stopped: 'video recording stopped — saved to {path}',
      },
    });
  });

  it('VALID: {actions} => contains start and stop', () => {
    expect(videoStatics.actions).toStrictEqual(['start', 'stop']);
  });

  it('VALID: {readings.started} => returns video recording started template', () => {
    expect(videoStatics.readings.started).toBe('video recording started');
  });

  it('VALID: {readings.stopped} => returns video recording stopped template', () => {
    expect(videoStatics.readings.stopped).toBe('video recording stopped — saved to {path}');
  });
});

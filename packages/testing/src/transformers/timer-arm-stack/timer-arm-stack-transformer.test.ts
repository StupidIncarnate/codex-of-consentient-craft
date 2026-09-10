import { timerArmStackTransformer } from './timer-arm-stack-transformer';
import { openHandleStatics } from '../../statics/open-handle/open-handle-statics';

describe('timerArmStackTransformer', () => {
  describe('caller frames', () => {
    it('VALID: {stack with header and two frames} => drops the header, keeps both frames', () => {
      const stack = [
        'Error: armed',
        '    at pollBroker (/repo/packages/a/src/poll-broker.ts:12:3)',
        '    at Object.<anonymous> (/repo/packages/a/src/poll.test.ts:4:5)',
      ].join('\n');

      const result = timerArmStackTransformer({ stack });

      expect(result).toBe(
        'at pollBroker (/repo/packages/a/src/poll-broker.ts:12:3)\n' +
          'at Object.<anonymous> (/repo/packages/a/src/poll.test.ts:4:5)',
      );
    });

    it('VALID: {stack naming the watch adapter} => drops that frame', () => {
      const stack = [
        'Error: armed',
        '    at timersWatchAdapter (/repo/packages/testing/src/adapters/timers/watch/timers-watch-adapter.ts:70:5)',
        '    at pollBroker (/repo/packages/a/src/poll-broker.ts:12:3)',
      ].join('\n');

      const result = timerArmStackTransformer({ stack });

      expect(result).toBe('at pollBroker (/repo/packages/a/src/poll-broker.ts:12:3)');
    });

    it('VALID: {stack with node internals} => drops those frames', () => {
      const stack = [
        'Error: armed',
        '    at listOnTimeout (node:internal/timers:594:17)',
        '    at pollBroker (/repo/packages/a/src/poll-broker.ts:12:3)',
      ].join('\n');

      const result = timerArmStackTransformer({ stack });

      expect(result).toBe('at pollBroker (/repo/packages/a/src/poll-broker.ts:12:3)');
    });
  });

  describe('frame cap', () => {
    it('EDGE: {stack with more frames than the cap} => keeps the first cap frames, in order', () => {
      const frameCount = openHandleStatics.report.maxStackFrames + 5;
      const stack = [
        'Error: armed',
        ...Array.from(
          { length: frameCount },
          (_unused, index) => `    at f${String(index)} (/a.ts:1:1)`,
        ),
      ].join('\n');

      const result = timerArmStackTransformer({ stack });

      expect(result.split('\n')).toStrictEqual(
        Array.from(
          { length: openHandleStatics.report.maxStackFrames },
          (_unused, index) => `at f${String(index)} (/a.ts:1:1)`,
        ),
      );
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {stack: undefined} => returns an empty string', () => {
      const result = timerArmStackTransformer({});

      expect(result).toBe('');
    });

    it('EMPTY: {stack: header only} => returns an empty string', () => {
      const result = timerArmStackTransformer({ stack: 'Error: armed' });

      expect(result).toBe('');
    });
  });
});

import { qualityGateStatics } from './quality-gate-statics';

describe('qualityGateStatics', () => {
  describe('exported shape', () => {
    it('VALID: exported value => matches the full expected object', () => {
      expect(qualityGateStatics).toStrictEqual({
        slowFiles: {
          heading: 'SLOW TESTS FAILED THIS RUN',
          guidance:
            'Every suite named under "slow files" is over the test-body threshold. Fix the test, ' +
            'or raise slowFileThresholdStatics deliberately — a run is not green while these stand.',
        },
        openHandles: {
          heading: 'OPEN HANDLES FAILED THIS RUN',
          guidance:
            'Every handle named under "open handles" was still holding the event loop when its ' +
            'suite ended. Clear the timer, close the socket, or kill the child process it names.',
        },
      });
    });
  });
});

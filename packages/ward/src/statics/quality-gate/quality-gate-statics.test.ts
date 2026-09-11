import { qualityGateStatics } from './quality-gate-statics';

describe('qualityGateStatics', () => {
  describe('exported shape', () => {
    it('VALID: exported value => matches the full expected object', () => {
      expect(qualityGateStatics).toStrictEqual({
        slowFiles: {
          jestNote:
            'ranked on the slowest single test; the suite total and test count follow it, so a ' +
            'big file reads differently from a slow one',
          lintNote:
            'ranked on rule time; wall also carries the TypeScript program build, charged to ' +
            'whichever file the parser reached first',
          browserNote:
            'ranked on the slowest single test, which excludes browser and server startup; the ' +
            'spec total and test count follow it',
          heading: 'SLOW TESTS FAILED THIS RUN',
          guidance:
            'Every file named under "slow files" holds a test over its check\'s threshold — the ' +
            'slowest single test for jest and Playwright, rule time for lint. Fix that test, or ' +
            'raise slowFileThresholdStatics deliberately — a run is not green while these stand.',
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

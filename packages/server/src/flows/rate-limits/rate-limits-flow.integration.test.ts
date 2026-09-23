import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { RateLimitsFlow } from './rate-limits-flow';

describe('RateLimitsFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/rate-limits', () => {
    // One isolated dungeonmaster home for the whole suite, and the requests are made HERE rather
    // than in the `it` blocks. Both halves are load-bearing.
    //
    // ISOLATION is what makes `snapshot: null` an assertion rather than a coincidence. The reading
    // is null until a window has a LEARNED ceiling, and ceilings live in the ledger under this
    // home — so a fresh one has none, on every machine, whatever the developer's own quota has
    // done today. It also keeps the staging file out of the directory every other dungeonmaster
    // process on the machine writes its own ledger through.
    //
    // beforeAll is what keeps the COST off a test. Serving this route walks every Claude transcript
    // under `os.homedir()`. `jest.setup-global.js`'s `globalSetup` sandboxes `HOME` for the whole
    // run, once, before any worker forks, so that walk reads the run's own sandbox rather than a
    // real developer's transcript tree — but it is still a real disk walk, over whatever OTHER
    // tests in this same run have already written there (every worker shares the one sandbox). Doing
    // it once, in `beforeAll`, rather than once per `it`, is what keeps that walk off any single
    // test's own measured window; jest brackets `beforeEach` inside a test's window and leaves
    // `beforeAll` outside it, so paying the walk per-`it` would report shared setup cost as though it
    // belonged to whichever test happened to run first.
    let firstResponse: Response | undefined;
    let secondResponse: Response | undefined;
    let firstBody: unknown;
    let secondBody: unknown;
    let restoreHome: (() => void) | undefined;

    beforeAll(async () => {
      restoreHome = harness.setupTestHome({ baseName: 'rate-limits' });
      const app = RateLimitsFlow();

      firstResponse = await app.request('/api/rate-limits');
      firstBody = await firstResponse.json();

      secondResponse = await app.request('/api/rate-limits');
      secondBody = await secondResponse.json();
    });

    afterAll(() => {
      restoreHome?.();
    });

    it('VALID: {a home with no learned ceiling} => delegates to RateLimitsGetResponder and returns 200 with {snapshot: null}', () => {
      expect(firstResponse?.status).toBe(200);
      expect(harness.toPlain(firstBody)).toStrictEqual({ snapshot: null });
    });

    it('VALID: {repeated invocation} => GET /api/rate-limits remains idempotent and returns 200 each call', () => {
      expect(secondResponse?.status).toBe(200);
      expect(harness.toPlain(secondBody)).toStrictEqual({ snapshot: null });
    });
  });
});

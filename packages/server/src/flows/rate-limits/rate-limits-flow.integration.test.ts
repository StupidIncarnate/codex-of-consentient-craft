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
    // under the OS user home, which is the one thing a jest test cannot isolate — `os.homedir()`
    // reads the real environ through libuv, and jest hands the test a COPY of `process.env`, so
    // assigning HOME here looks like it worked and changes nothing. That walk is the suite's price
    // of admission, paid once; jest brackets `beforeEach` inside a test's measured window and
    // leaves `beforeAll` outside it, so charging it to whichever test happened to run first
    // reported a machine-wide disk walk as a slow test.
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

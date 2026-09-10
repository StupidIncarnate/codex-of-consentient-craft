import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { e2eArtifactsHarness } from '../../../../test/harnesses/e2e-artifacts/e2e-artifacts.harness';
import { e2eArtifactsPruneBroker } from './e2e-artifacts-prune-broker';

// The unit tests beside this one all mock the filesystem, so every one of them would stay green
// against a broker that built the WRONG path string: it would delete nothing, for ever, and read as
// a success. This is the only test that grades the claim the feature rests on — that
// `<packageRoot>/node_modules/.vite-<port>` names the directory a real run leaves behind.
describe('e2eArtifactsPruneBroker (integration)', () => {
  const harness = e2eArtifactsHarness();

  // Ports well above the ephemeral range, so nothing on this machine is listening on them and the
  // bound-port guard cannot make this flaky.
  const STALE_CACHE = 'node_modules/.vite-64001';
  const FRESH_CACHE = 'node_modules/.vite-64002';
  const RECENT_TRACE = 'test-results/64003';
  const OLD_TRACE = 'test-results/64004';
  const FOREIGN_TRACE = 'test-results/my-spec-renders-chromium';
  const OLD_REPORT = '.ward-playwright-report-64005.json';

  it('VALID: {stale cache, fresh cache, traces of both ages, another project’s folder} => takes only what it owns, only past its own window', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-e2e-artifacts' }),
    });
    const packageRoot = AbsoluteFilePathStub({ value: testbed.guildPath });

    // Every age sits a clean 2x either side of the window it is grading, so neither a rounding
    // error nor a slow testbed can decide the result: the cache window is one day, the evidence
    // window two.
    harness.seedDir({ packageRoot, relativePath: STALE_CACHE, daysOld: 2 });
    harness.seedDir({ packageRoot, relativePath: FRESH_CACHE, daysOld: 0.5 });
    harness.seedDir({ packageRoot, relativePath: RECENT_TRACE, daysOld: 1 });
    harness.seedDir({ packageRoot, relativePath: OLD_TRACE, daysOld: 4 });
    // Playwright's DEFAULT outputDir naming, from a repo that never adopted per-port paths. This
    // fixture is what grades the blast radius.
    harness.seedDir({ packageRoot, relativePath: FOREIGN_TRACE, daysOld: 60 });
    harness.seedFile({ packageRoot, relativePath: OLD_REPORT, daysOld: 4 });

    await e2eArtifactsPruneBroker({ packageRoot });

    const staleCache = harness.exists({ packageRoot, relativePath: STALE_CACHE });
    const freshCache = harness.exists({ packageRoot, relativePath: FRESH_CACHE });
    const recentTrace = harness.exists({ packageRoot, relativePath: RECENT_TRACE });
    const oldTrace = harness.exists({ packageRoot, relativePath: OLD_TRACE });
    const foreignTrace = harness.exists({ packageRoot, relativePath: FOREIGN_TRACE });
    const oldReport = harness.exists({ packageRoot, relativePath: OLD_REPORT });

    testbed.cleanup();

    expect({
      staleCache,
      freshCache,
      recentTrace,
      oldTrace,
      foreignTrace,
      oldReport,
    }).toStrictEqual({
      // Past the one-day cache window. This one is the 904 MB.
      staleCache: false,
      // Inside the cache window.
      freshCache: true,
      // Older than the cache window, and still kept: a trace carries the evidence window instead,
      // the same one ward's own run results get, and for the same reason.
      recentTrace: true,
      // Past the evidence window.
      oldTrace: false,
      // Not port-named, so not ours at any age.
      foreignTrace: true,
      // Ward's own report, past the evidence window.
      oldReport: false,
    });
  });

  it('EMPTY: {a package with no node_modules and no test-results} => succeeds and changes nothing', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'ward-e2e-artifacts-bare' }),
    });
    const packageRoot = AbsoluteFilePathStub({ value: testbed.guildPath });

    const before = harness.listRoot({ packageRoot });

    const result = await e2eArtifactsPruneBroker({ packageRoot });

    const after = harness.listRoot({ packageRoot });

    testbed.cleanup();

    expect({ result, after }).toStrictEqual({ result: { success: true }, after: before });
  });
});

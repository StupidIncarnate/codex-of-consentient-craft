import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';

import { locationsStatics } from '@dungeonmaster/shared/statics';

const TEST_HOME = process.env.E2E_TEST_HOME ?? path.join(os.tmpdir(), `dm-e2e-${process.pid}`);

// The two sandbox namings that land under `os.tmpdir()`, each named by the file that mints it:
// `playwright.config.ts`'s `dm-e2e-<pid>` and `test/siege-driver/siege-lane.ts`'s
// `dm-siege-<lane>-<pid>`.
const E2E_SANDBOX_PREFIX = 'dm-e2e-';
const SIEGE_SANDBOX_PREFIX = 'dm-siege-';
// Six hours. `global-teardown.ts` is the only thing that removes a sandbox, and Playwright runs NO
// global teardown when its runner is killed — so every crashed or SIGKILLed run abandons its home
// on disk and SETUP is the one hook that still runs afterwards. An mtime threshold is the sole
// guard against sweeping a sandbox a CONCURRENT run is still using (several walks are expected at
// once, each on its own port pair), so it has to outlast the longest suite by a wide margin while
// still bounding the litter.
const STALE_SANDBOX_MS = 21_600_000;

export default function globalSetup(): void {
  const nowMs = Date.now();
  const tmpRoot = os.tmpdir();

  for (const entry of readdirSync(tmpRoot)) {
    const entryPath = path.join(tmpRoot, entry);
    // TEST_HOME is excluded whatever its mtime reads: this run owns it, and a re-used
    // `E2E_TEST_HOME` can be arbitrarily old while still being the home about to be written to.
    if (
      !(entry.startsWith(E2E_SANDBOX_PREFIX) || entry.startsWith(SIEGE_SANDBOX_PREFIX)) ||
      entryPath === TEST_HOME
    ) {
      continue;
    }
    try {
      if (nowMs - statSync(entryPath).mtimeMs >= STALE_SANDBOX_MS) {
        rmSync(entryPath, { recursive: true, force: true });
      }
    } catch (error: unknown) {
      // One entry nobody can stat or remove — another user's sandbox, or one a run that ended a
      // moment ago is still tearing down — must not take the whole suite with it.
      process.stderr.write(`[e2e-setup] sandbox sweep skipped ${entryPath}: ${String(error)}\n`);
    }
  }

  mkdirSync(TEST_HOME, { recursive: true });
  mkdirSync(path.join(TEST_HOME, 'claude-queue'), { recursive: true });
  mkdirSync(path.join(TEST_HOME, 'ward-queue'), { recursive: true });

  // An empty ledger stamped NOW, so the first guardrail poll after boot finds a measurement inside
  // `usageAccountingStatics.scan.minIntervalMs` and `usageLedgerScanBroker` hands this file
  // straight back. The default ledger is stamped at the epoch, which EVERY poll reads as a
  // measurement due — and the scan then walks the `.claude/projects` under whatever
  // `os.homedir()` resolves to. That tree is empty here only because `playwright.config.ts`
  // redirects `HOME` to TEST_HOME in the API server's `webServer` env; without the redirect the
  // poller walks the DEVELOPER'S OWN transcripts on every server boot — minutes of wall clock,
  // for a reading no spec asked for. This seed covers the BOOT of every server the suite starts;
  // the redirect is what covers every poll after the throttle window expires, so removing it
  // leaves the suite protected for one minute and no longer.
  writeFileSync(
    path.join(TEST_HOME, locationsStatics.dungeonmasterHome.usageLedger),
    JSON.stringify({
      buckets: {},
      cursors: {},
      ceilings: { fiveHour: null, sevenDay: null },
      updatedAt: new Date().toISOString(),
    }),
  );
}

import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';

import { wardRunnerHarness } from '../../test/harnesses/ward-runner/ward-runner.harness';
import { WardResultStub } from '../contracts/ward-result/ward-result.stub';

import { StartWard } from './start-ward';

// harness.runAndMonitorMemory spawns `npx tsx --conditions=source bin/ward-entry.ts run --only
// lint` and walks the whole descendant pid tree (tsx's own process, the worker pid it forks to
// actually run, esbuild, up to 4 concurrent per-package `dungeonmaster-ward` children —
// CONCURRENCY_LIMIT in multiPackageLayerBroker — and each child's own eslint grandchild), then
// asserts the MAX SINGLE-PROCESS RSS observed across that tree, not the sum.
//
// NOTE FOR A FUTURE READER: `src/startup/start-ward.ts` exports `StartWard` but never calls it —
// only `bin/ward-entry.ts` does that — so a spawn of start-ward.ts loads ward's module import
// graph and exits without ever reaching WardFlow/WardRunResponder or execing eslint. Confirmed
// empirically: that spawn emits no stdout and no eslint child appears in `pgrep -P <pid>`, versus
// spawning bin/ward-entry.ts with the same args, which fans out one eslint child per package
// (`lint        @dungeonmaster/<pkg> running...` / PASS / FAIL lines on stdout). A ceiling on the
// start-ward.ts spawn bounds only tsx/esbuild's cost of loading ward's module graph under
// `--conditions=source` — a MODULE LOAD, never a run. The harness now spawns bin/ward-entry.ts.
//
// The tree walk used to report the SUM of RSS across every pid in the tree. A first
// re-measurement against the real bin/ward-entry.ts spawn put that sum at ~4.9 GB against the old
// 400_000 KB ceiling — technically proof the old ceiling measured nothing real, but the sum
// itself has no physical memory meaning: `ps -o rss=` counts shared pages (the node binary,
// shared libraries, copy-on-write pages) once PER PROCESS, so summing across up to 4 concurrent
// eslint children double/triple/quadruple-counts the same physical pages, and the total drifts
// every time a workspace package is added or removed. The MAX single-process RSS answers the real
// question instead — did any ONE ward process balloon — without that distortion.
//
// Measured (this repo, 2026-09-06, live multi-agent dev session — several other agents' own
// `npm run ward` invocations ran concurrently throughout, so these numbers include real
// system-wide contention, not an isolated worktree): 3 runs of the real bin/ward-entry.ts spawn,
// max single-process RSS per run: [3051796, 2933088, 2352580] KB
// min 2352580, max 3051796, avg 2779155 — the ~23% spread across runs tracks contention (which
// package's eslint process happened to be biggest/least-preempted when polled), not the code
// under test. Ceiling set to the observed peak (3051796) + ~31% headroom (948204 KB) so that
// spread — and normal run-to-run jitter — can't flip it, while a genuine single-process
// regression (a package's eslint memory materially growing) still trips it.
const MAX_RSS_KB = 4_000_000;
const VALID_RUN_ID = '1739625600000-a3f1';

describe('StartWard', () => {
  const harness = wardRunnerHarness();

  describe('delegation to ward flow', () => {
    it('VALID: {args: ["node", "ward", "unknown-command"]} => completes without throwing for unknown command', async () => {
      await expect(StartWard({ args: ['node', 'ward', 'unknown-command'] })).resolves.toStrictEqual(
        { success: true },
      );
    });
  });

  describe('detail subcommand', () => {
    it('VALID: {args: ["node", "ward", "detail", runId, filePath]} => completes without throwing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-ward-detail' }),
      });

      const wardResultRelativePath = RelativePathStub({
        value: `.ward/run-${VALID_RUN_ID}.json`,
      });

      testbed.writeFile({
        relativePath: wardResultRelativePath,
        content: FileContentStub({ value: JSON.stringify(WardResultStub()) }),
      });

      const originalCwd = process.cwd();
      process.chdir(testbed.guildPath);

      let error: unknown;
      try {
        await StartWard({
          args: ['node', 'ward', 'detail', VALID_RUN_ID, 'src/index.ts'],
        });
      } catch (e) {
        error = e;
      } finally {
        process.chdir(originalCwd);
        testbed.cleanup();
      }

      expect(error).toBe(undefined);
    });

    it('VALID: {args: ["node", "ward", "detail"]} with missing runId => prints usage and completes', async () => {
      await expect(StartWard({ args: ['node', 'ward', 'detail'] })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {args: ["node", "ward", "detail", runId, "--json"]} => completes without throwing', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-ward-detail-json' }),
      });

      const wardResultRelativePath = RelativePathStub({
        value: `.ward/run-${VALID_RUN_ID}.json`,
      });

      testbed.writeFile({
        relativePath: wardResultRelativePath,
        content: FileContentStub({ value: JSON.stringify(WardResultStub()) }),
      });

      const originalCwd = process.cwd();
      process.chdir(testbed.guildPath);

      let error: unknown;
      try {
        await StartWard({
          args: ['node', 'ward', 'detail', VALID_RUN_ID, '--json'],
        });
      } catch (e) {
        error = e;
      } finally {
        process.chdir(originalCwd);
        testbed.cleanup();
      }

      expect(error).toBe(undefined);
    });
  });

  describe('memory ceiling', () => {
    it('EDGE: {--only lint, all packages} => no single ward process RSS exceeds ~3.8GB', async () => {
      // wardBinExists() is this package's one "the build produced a runnable binary" assertion —
      // it deliberately keeps reading dist/, unlike runAndMonitorMemory below which spawns
      // source. `npm run build` is its prerequisite; run it before this test or it fails on a
      // clean checkout even though nothing here is broken.
      expect(harness.wardBinExists()).toBe(true);

      const { maxRssKb } = await harness.runAndMonitorMemory({
        args: ['run', '--only', 'lint'],
      });

      expect(maxRssKb).toBeLessThan(MAX_RSS_KB);
    }, 660_000); // TIMEBOUND: runAndMonitorMemory spawns a real full-repo lint sweep with a
    // 600_000ms internal safety timeout (PROCESS_TIMEOUT_MS in the harness); this Jest timeout
    // must exceed that so the harness's own timeout — not Jest's — is what resolves a hang.
  });
});

/**
 * PURPOSE: Defines when ward calls a file slow. One number per thing a check can actually measure —
 * reach for `testWarnMs` for a jest unit suite, `integrationTestWarnMs` for a jest integration
 * suite, `lintRulesWarnMs` for eslint's rule work, and `warnMs` only for a check that gives no
 * per-file breakdown at all. `allowed` names the individual files that may exceed their bar.
 *
 * USAGE:
 * slowFileThresholdStatics.threshold.testWarnMs;
 * // Returns: 1000 (1 second of actual test bodies)
 */
export const slowFileThresholdStatics = {
  threshold: {
    // Wall time — jest's `endTime - startTime`. It spans the package's one-time compile and its
    // module evaluation, both of which land on whichever suite reaches a module FIRST, so it says
    // where a file sat in the run rather than what it cost. Used only where nothing better exists.
    warnMs: 5000,
    // Summed assertion durations: the test bodies themselves. Measured across two packages on a
    // warm cache, one suite of 176 exceeded 1s and none exceeded 3s, so this names the outliers
    // rather than a third of the repo.
    testWarnMs: 1000,
    // An integration test may spawn real processes — that is what makes it one — and a spawned
    // child in this repo costs about a second before doing any work of its own: node boot plus the
    // `@dungeonmaster/shared` module graph, measured at 0.97s for `start-pre-bash-hook`, which
    // lints nothing. Held ABOVE the unit bar for that reason and no higher: across the whole
    // integration check, 110 of 126 files finish under one second, so a file over three is either
    // spawning or worth a look. Two whole-check runs flagged the SAME eleven files at this bar; at
    // five seconds one run flagged eight and the next three, which is a gate reporting the
    // machine's load rather than the suite.
    integrationTestWarnMs: 3000,
    // Summed eslint rule time plus fix, with the TypeScript program build left out. Measured over
    // a whole-package lint of `web` and of `shared` on a quiet machine: medians of 14ms and 8.5ms,
    // 99th percentiles of 293ms and 109ms, and single worst files of 873ms and 596ms — nothing
    // reached a second. Held at the jest bar rather than dropped to the low hundreds because rule
    // time roughly doubles under CPU contention (one 40-file batch's worst file went 335ms to
    // 636ms at 3x oversubscription), and a flagged file FAILS the run.
    lintRulesWarnMs: 1000,
    // A browser spec navigates, waits for real paint and talks to a real server, so it cannot be
    // held to the jest bar. Playwright reports execution time per test and excludes browser boot,
    // so this is still test-body time and not startup. Calibrated on the five specs of one batch,
    // which summed 0.2s to 1.4s each — a small sample, and worth revisiting once a full sweep has
    // reported all 111.
    e2eTestWarnMs: 5000,
  },
  // Files that may exceed their bar, each with the cost that was measured and why that cost is the
  // test doing its job. A file over its OWN number still fails, so this excuses a known price and
  // never a regression. A key is matched against the END of the path jest reports, which is
  // absolute.
  //
  // WHY THE NUMBERS LOOK GENEROUS. They are what a FULL run reports, which is what the gate
  // grades, and a full run puts four packages and each one's jest workers on the machine at once.
  // The same file measures far less alone: `start-pre-edit-hook` read 33.0s in a whole-check run,
  // 18.3s running its package by itself and 16.0s running on its own. Two whole-check runs back to
  // back then spread 10% to 35% on these files, worst on the biggest, so each entry carries
  // roughly half again over the higher of the two. That buys a gate which catches a file doubling
  // rather than one which catches a busy afternoon.
  //
  // Every entry spawns real OS processes. Nothing here waits on a sleep or a poll; the cost is
  // node booting and loading the `@dungeonmaster/shared` graph, once per child.
  allowed: {
    'packages/hooks/src/startup/start-pre-edit-hook.integration.test.ts': {
      testMs: 50000,
      why: 'two spawnSync children for the exit-0 and exit-2 paths — one process yields one exit code, so they cannot share one — plus a persistent worker, and each of the three loads the repo eslint config',
    },
    'packages/hooks/src/startup/start-post-edit-hook.integration.test.ts': {
      testMs: 20000,
      why: 'spawns the hook binary per case and lints through the real eslint config in each child',
    },
    'packages/tooling/src/flows/primitive-duplicate-detection/primitive-duplicate-detection-flow.integration.test.ts':
      {
        testMs: 14000,
        why: 'runs the tooling CLI as a real process per case, over files it writes to a fresh temp directory each time',
      },
    'packages/ward/src/startup/start-ward.integration.test.ts': {
      testMs: 10000,
      why: 'spawns ward itself and watches the child, so one case costs a whole ward run',
    },
    'packages/mcp/src/startup/start-mcp-server.integration.test.ts': {
      testMs: 10000,
      why: 'boots a real MCP server child and speaks the protocol to it over stdio',
    },
    'packages/hooks/src/startup/start-post-ask-question-hook.integration.test.ts': {
      testMs: 9000,
      why: 'spawns the hook binary per case; the child loads the shared graph before it reads stdin',
    },
    'packages/hooks/src/startup/start-pre-search-hook.integration.test.ts': {
      testMs: 9000,
      why: 'spawns the hook binary per case; the child loads the shared graph before it reads stdin',
    },
    'packages/hooks/src/startup/start-pre-folder-detail-hook.integration.test.ts': {
      testMs: 9000,
      why: 'spawns the hook binary per case; the child loads the shared graph before it reads stdin',
    },
    'packages/hooks/src/startup/start-worktree-create-hook.integration.test.ts': {
      testMs: 8000,
      why: 'spawns the hook binary per case; the child loads the shared graph before it reads stdin',
    },
    'packages/cli/bin/cli-entry.integration.test.ts': {
      testMs: 8000,
      why: 'runs the real dungeonmaster CLI in a child and requires the built bundle there, which is the only way to prove the published entry point loads',
    },
    'packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.integration.test.ts':
      {
        testMs: 8000,
        why: 'the adapter under test spawns child processes, so every case is a real spawn and its stream',
      },
  },
} as const;

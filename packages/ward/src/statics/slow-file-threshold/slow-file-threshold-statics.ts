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
    // The WORST SINGLE TEST in a unit suite, not the suite's sum — see `fileTimingContract` for
    // why a sum grades a file on how many tests it holds. Measured across the thirteen slowest
    // unit files in this repo: the worst single test anywhere was 413ms, and the files that used
    // to trip a summed bar hold 87, 96 and 153 tests at 18-20ms each. So a second of ONE test is
    // well clear of anything healthy here, and it is the bar that caught the real defect this was
    // calibrated against — one test sitting through a responder's real 3s retry budget.
    testWarnMs: 1000,
    // An integration test may spawn real processes — that is what makes it one — and a spawned
    // child in this repo costs about a second before doing any work of its own: node boot plus the
    // `@dungeonmaster/shared` module graph, measured at 0.97s for `start-pre-bash-hook`, which
    // lints nothing. So ONE test doing a spawn and its work sits near two seconds, and three is
    // the bar that leaves that alone while naming a test doing markedly more.
    integrationTestWarnMs: 3000,
    // Summed eslint rule time plus fix, with the TypeScript program build left out. Measured over
    // a whole-repo lint of all 7758 files: median 14ms, 90th percentile 50ms, 99th 219ms, and a
    // top file at 1148ms with the next at 778ms.
    //
    // TWO SECONDS, not the one the jest bars use, because rule time roughly doubles under CPU
    // contention — one 40-file batch's worst file went 335ms to 636ms at 3x oversubscription —
    // and a flagged file FAILS the run. At one second the gate named zero files on one whole-repo
    // run and one on the next, the same tree both times, which reports the machine rather than the
    // code. Two clears twice the worst healthy file and still catches anything that doubles past
    // it.
    lintRulesWarnMs: 2000,
    // A browser spec navigates, waits for real paint and talks to a real server, so it cannot be
    // held to the jest bar. Playwright reports execution time per test and excludes browser boot,
    // so this is still test-body time and not startup.
    //
    // Now calibrated on the whole suite rather than the five specs of one batch. Across 110 specs
    // and 440 tests, the median spec's worst test runs 0.53s; two specs hold a test over four
    // seconds and ONE holds a test over five. So this names a single outlier, which is what it is
    // for — at three seconds it would name four specs, three of which are a deliberate delay the
    // test is measuring.
    e2eTestWarnMs: 5000,
  },
  // Files whose WORST SINGLE TEST may exceed its bar, each with the cost that was measured and
  // why that cost is the test doing its job. A file past its OWN number still fails, so this
  // excuses a known price and never a regression. A key is matched against the END of the path
  // jest reports, which is absolute.
  //
  // EVERY ENTRY IS A REAL SUBPROCESS. Nothing here is on the list for its size: the gate reads the
  // worst single test, so a file holding 153 cheap tests is a big file and never reaches this
  // list. Switching to that reading took the flagged set from sixteen files to these nine, and the
  // seven that dropped off — a tooling flow at 8.9s, a server flow, two orchestrator flows — were
  // every one of them a suite total rather than a slow test.
  //
  // THE NUMBERS CARRY HEADROOM FOR CONTENTION. They are what a FULL run reports, which is what the
  // gate grades, and a full run puts four packages and each one's jest workers on the machine at
  // once. The same test measures far less alone: `start-pre-edit-hook`'s worst case read 11.9s in a
  // whole-check run and 4.0s running that file by itself. So each entry sits near half again over
  // the higher figure, which buys a gate that catches a test doubling rather than one that catches
  // a busy afternoon.
  allowed: {
    'packages/hooks/src/startup/start-pre-edit-hook.integration.test.ts': {
      slowestTestMs: 18000,
      why: 'a spawnSync child that lints through the real eslint config; its sibling case covers the exit-2 path, and one process yields one exit code so the two cannot share a spawn',
    },
    'packages/hooks/src/startup/start-post-edit-hook.integration.test.ts': {
      slowestTestMs: 14000,
      why: 'spawns the hook binary and lints through the real eslint config inside the child',
    },
    'packages/mcp/src/startup/start-mcp-server.integration.test.ts': {
      slowestTestMs: 11000,
      why: 'boots a real MCP server child and speaks the protocol to it over stdio',
    },
    'packages/ward/src/startup/start-ward.integration.test.ts': {
      slowestTestMs: 10000,
      why: 'spawns ward itself and watches the child, so one case costs a whole ward run',
    },
    'packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.integration.test.ts':
      {
        slowestTestMs: 7000,
        why: 'the adapter under test spawns child processes, so the case is a real spawn and its stream',
      },
    'packages/hooks/src/startup/start-post-ask-question-hook.integration.test.ts': {
      slowestTestMs: 6000,
      why: 'spawns the hook binary; the child loads the shared module graph before it reads stdin',
    },
    'packages/cli/bin/cli-entry.integration.test.ts': {
      slowestTestMs: 6000,
      why: 'runs the real dungeonmaster CLI in a child and requires the built bundle there, which is the only way to prove the published entry point loads',
    },
    'packages/hooks/src/startup/start-worktree-create-hook.integration.test.ts': {
      slowestTestMs: 5000,
      why: 'spawns the hook binary; the child loads the shared module graph before it reads stdin',
    },
    'packages/hooks/src/startup/start-pre-folder-detail-hook.integration.test.ts': {
      slowestTestMs: 5000,
      why: 'spawns the hook binary; the child loads the shared module graph before it reads stdin',
    },
    'flows/quest-chat/send-images-chat-route.e2e.ts': {
      slowestTestMs: 12000,
      why: 'its worst case sends images deliberately large enough for an upload progress bar to paint and climb from 0 to 100, so the transfer time IS what the test observes; a smaller payload would finish before the bar could be seen at all',
    },
  },
} as const;

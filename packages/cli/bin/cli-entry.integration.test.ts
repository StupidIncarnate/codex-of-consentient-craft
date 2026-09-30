/**
 * PURPOSE: Integration tests for the dungeonmaster CLI binary built from cli-entry
 *
 * USAGE:
 * npm test -- cli-entry.integration.test.ts
 */

import { siegelenseHelpStatics } from '@dungeonmaster/siegelense/statics';

import { cliBinHarness } from '../test/harnesses/cli-bin/cli-bin.harness';

type BuiltSiegelenseCall = keyof typeof siegelenseHelpStatics.calls;

// Derived from the statics, never hardcoded — every other siegelense test in this repo starts at
// SiegelenseFlow or below, so only a spawned process above the CliSiegelenseResponder gate can
// prove the gate itself is open.
const BUILT_CALL_NAMES = Object.keys(siegelenseHelpStatics.calls) as readonly BuiltSiegelenseCall[];
const UNKNOWN_SUBCOMMAND_STDERR =
  'Error: Unknown siegelense subcommand: statuss\n\n' +
  'Usage: dungeonmaster siegelense [--help | start | run | results | kill | capacity | status | ' +
  'cleanup | prune | compare | snapshots | recipes | docs | driver --instance <instanceId>]\n';
// DEF-63: `profile` is no longer a built call — this pins it to the SAME unknown-subcommand
// refusal any other unrecognised name gets, off the usage line above with `profile` gone from it.
const PROFILE_UNKNOWN_SUBCOMMAND_STDERR =
  'Error: Unknown siegelense subcommand: profile\n\n' +
  'Usage: dungeonmaster siegelense [--help | start | run | results | kill | capacity | status | ' +
  'cleanup | prune | compare | snapshots | recipes | docs | driver --instance <instanceId>]\n';
// The rendered index carries no build-progress count — read straight off the same static
// siegelenseHelpRenderTransformer prints verbatim, so this can never go stale against it.
const EXPECTED_INDEX_HEADLINE = siegelenseHelpStatics.index.headline;
// This suite's own beforeAll runs every spawn in parallel (Promise.all), so the wall time it
// costs is close to ONE spawn's, not the sum of fifteen. Each spawn still carries its own
// RUN_COMMAND_TIMEOUT_MS kill timer inside the harness; this is the outer jest hook budget.
const SIEGELENSE_SEAM_TIMEOUT_MS = 90_000;

// Both child spawns share this budget. The harness gives each its own internal kill timer —
// `RUN_COMMAND_TIMEOUT_MS` (60000ms) for runInit (via runCommand), 3000ms for the import probe —
// so this only has to outlast the pair (run sequentially below), leaving the harness's timers to
// be what resolves a hang. Kept aligned with `SIEGELENSE_SEAM_TIMEOUT_MS` below, since both wrap
// the same per-spawn timer and a full, unscoped `npm run ward` is what actually exhausts a thin
// margin here — see that constant's own comment.
const SPAWNS_TIMEOUT_MS = 90_000;

describe('dungeonmaster binary', () => {
  const harness = cliBinHarness();

  // Both spawns run HERE because what they cost is the RUNTIME's, not the assertions'. `runInit`
  // launches `npx tsx --conditions=source bin/cli-entry.ts`, and nearly all of its measured 3524ms
  // was that child compiling and loading the CLI's module graph before `init` did anything. jest
  // runs beforeAll outside the test_start..test_done window, so the boot lands in the suite's wall
  // time — which ward already reports as `durationMs` — and each test measures its own assertion.
  let init: Awaited<ReturnType<typeof harness.runInit>>;
  let importProbe: Awaited<ReturnType<typeof harness.requireWithoutAutorun>>;

  beforeAll(async () => {
    init = await harness.runInit();
    importProbe = await harness.requireWithoutAutorun();
  }, SPAWNS_TIMEOUT_MS);

  describe('file structure', () => {
    // This describe block is the one place that keeps grading the built esbuild bundle instead
    // of source — it's asking "did the build produce a runnable binary at the expected path?",
    // which only dist/ can answer. `npm run build` is its prerequisite; run it before these
    // tests or they fail on a clean checkout even though nothing here is broken.
    it('VALID: {} => bin file exists', () => {
      expect(harness.binExists()).toBe(true);
    });

    it('VALID: {} => bin file is executable', () => {
      expect(harness.binIsExecutable()).toBe(true);
    });

    it('VALID: {} => bin file has shebang', () => {
      expect(harness.readBinContent().startsWith('#!/usr/bin/env node')).toBe(true);
    });
  });

  describe('process execution', () => {
    it('VALID: {non-TTY, init} => runs init command and exits successfully', () => {
      expect(init.exitCode).toBe(0);
    });

    it('VALID: {required as a module} => exits cleanly without booting the server or opening a browser', () => {
      expect(importProbe).toStrictEqual({
        exitedCleanly: true,
        servedLineSeen: false,
      });
    });
  });
});

describe('dungeonmaster siegelense subcommand seam', () => {
  const harness = cliBinHarness();

  // Every spawn below is independent of every other, so they run together under one Promise.all
  // rather than paying ~4s each in sequence — the difference between this beforeAll costing about
  // as much as ONE of these spawns and costing fifteen times that. Results are captured here,
  // never inside an `it`, so each assertion below only reads an already-settled value and cannot
  // itself time out.
  let helpResults: Record<BuiltSiegelenseCall, Awaited<ReturnType<typeof harness.runCommand>>>;
  let bareHelp: Awaited<ReturnType<typeof harness.runCommand>>;
  let unknownSubcommand: Awaited<ReturnType<typeof harness.runCommand>>;
  let profileSubcommand: Awaited<ReturnType<typeof harness.runCommand>>;

  beforeAll(async () => {
    const [helpEntries, bareHelpResult, unknownSubcommandResult, profileSubcommandResult] =
      await Promise.all([
        Promise.all(
          BUILT_CALL_NAMES.map(
            async (call) =>
              [call, await harness.runCommand({ args: ['siegelense', call, '--help'] })] as const,
          ),
        ),
        harness.runCommand({ args: ['siegelense', '--help'] }),
        harness.runCommand({ args: ['siegelense', 'statuss'] }),
        harness.runCommand({ args: ['siegelense', 'profile'] }),
      ]);

    helpResults = helpEntries.reduce<
      Record<BuiltSiegelenseCall, Awaited<ReturnType<typeof harness.runCommand>>>
    >(
      (accumulator, [call, result]) => ({ ...accumulator, [call]: result }),
      {} as Record<BuiltSiegelenseCall, Awaited<ReturnType<typeof harness.runCommand>>>,
    );
    bareHelp = bareHelpResult;
    unknownSubcommand = unknownSubcommandResult;
    profileSubcommand = profileSubcommandResult;
  }, SIEGELENSE_SEAM_TIMEOUT_MS);

  // The failure this catches: a call that is built, helped and routed in SiegelenseFlow but
  // refused by CliSiegelenseResponder before it ever gets there — the exact shape of the bug that
  // shipped `status` and `cleanup` fully tested and untypeable. Against a closed gate this would
  // exit 1 with "Unknown siegelense subcommand" on stderr and nothing on stdout, failing both
  // assertions below.
  it.each(BUILT_CALL_NAMES)(
    "VALID: {dungeonmaster siegelense %s --help} => exits 0 and stdout's first line is that call's summary",
    (call) => {
      expect(helpResults[call].exitCode).toBe(0);
      expect(helpResults[call].stdout.split('\n')[0]).toBe(
        siegelenseHelpStatics.calls[call].summary,
      );
    },
  );

  it('VALID: {dungeonmaster siegelense --help} => exits 0 and prints the index page', () => {
    expect(bareHelp.exitCode).toBe(0);
    expect(bareHelp.stdout.split('\n')[0]).toBe(EXPECTED_INDEX_HEADLINE);
  });

  it('INVALID: {dungeonmaster siegelense statuss} => exits 1 and names the unknown subcommand on stderr', () => {
    expect(unknownSubcommand).toStrictEqual({
      exitCode: 1,
      stdout: '',
      stderr: UNKNOWN_SUBCOMMAND_STDERR,
    });
  });

  // DEF-63: `profile` carried no reader anywhere — `capacity` already prints the profile group it
  // divided by and `status`'s likelyCause quotes the peak inline — so it is refused as an unknown
  // subcommand no longer in the usage line, exactly like any other unrecognised name.
  it('INVALID: {dungeonmaster siegelense profile} => exits 1, refused as an unknown subcommand no longer in the usage line', () => {
    expect(profileSubcommand).toStrictEqual({
      exitCode: 1,
      stdout: '',
      stderr: PROFILE_UNKNOWN_SUBCOMMAND_STDERR,
    });
  });
});

describe('dungeonmaster siegelense piped into a reader that closes early', () => {
  const harness = cliBinHarness();

  // DEF-90 (2): agents pipe siegelense output into `head` constantly. Before SiegelenseFlow
  // registered an EPIPE guard on process.stdout, a closed reader crashed the CLI with an unhandled
  // `Error: write EPIPE` and a raw Node stack trace on stderr, exit code 1 — measured directly
  // against this exact spawn while this fix was under construction. `head -n 0` (this harness's
  // own comment says why) reproduces that deterministically for the bare invocation, which is now
  // the smallest possible siegelense output.
  // The spawn runs in beforeAll, like every other spawn in this file: its cost is tsx compiling
  // and loading the CLI's module graph, the runtime's rather than the assertions', and jest runs a
  // hook outside the test_start..test_done window that ward's slow-test gate measures.
  let closedReader: Awaited<ReturnType<typeof harness.runWithClosedStdoutReader>>;

  beforeAll(async () => {
    closedReader = await harness.runWithClosedStdoutReader({ args: ['siegelense'] });
  }, SPAWNS_TIMEOUT_MS);

  it('VALID: {dungeonmaster siegelense | head -n 0} => the CLI still exits 0, with no EPIPE stack trace on stderr', () => {
    expect(closedReader).toStrictEqual({ cliExitCode: 0, cliStderr: '' });
  });
});

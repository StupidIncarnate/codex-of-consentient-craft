/**
 * PURPOSE: Integration tests for the dungeonmaster CLI binary built from cli-entry
 *
 * USAGE:
 * npm test -- cli-entry.integration.test.ts
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { siegelenseCallStatics, siegelenseHelpStatics } from '@dungeonmaster/siegelense/statics';

import { cliBinHarness } from '../test/harnesses/cli-bin/cli-bin.harness';

type BuiltSiegelenseCall = keyof typeof siegelenseHelpStatics.calls;
// The union of all thirteen call names, read off the `includes` method's own parameter rather than
// an indexed-access type — the tuple's actual element union, not a second hand-typed copy of it.
type SiegelenseCallName = Parameters<(typeof siegelenseCallStatics.calls.names)['includes']>[0];

// The two lists below are the whole point of this file: every other siegelense test in this repo
// starts at SiegelenseFlow or below, so only a spawned process above the CliSiegelenseResponder
// gate can prove the gate itself is open. Derived from the statics, never hardcoded — a
// hand-maintained copy of either list is the exact route-table duplication this chunk removes.
const BUILT_CALL_NAMES = Object.keys(siegelenseHelpStatics.calls) as readonly BuiltSiegelenseCall[];
const ROUTED_CALL_NAME_SET = new Set(Object.keys(siegelenseHelpStatics.calls));
const NOT_BUILT_CALL_NAMES = siegelenseCallStatics.calls.names.filter(
  (name) => !ROUTED_CALL_NAME_SET.has(name),
);
const NOT_BUILT_REFUSAL_SUFFIX = `is a siegelense call but is not built yet. Built calls: ${BUILT_CALL_NAMES.join(', ')}.\n`;
const UNKNOWN_SUBCOMMAND_STDERR =
  'Error: Unknown siegelense subcommand: statuss\n\n' +
  'Usage: dungeonmaster siegelense [--help | start | run | results | kill | status | cleanup | ' +
  'compare | profile | snapshots | recipes | driver --instance <instanceId>]\n';
// This suite's own beforeAll runs every spawn in parallel (Promise.all), so the wall time it
// costs is close to ONE spawn's, not the sum of fifteen. Each spawn still carries its own
// RUN_COMMAND_TIMEOUT_MS kill timer inside the harness; this is the outer jest hook budget.
const SIEGELENSE_SEAM_TIMEOUT_MS = 90_000;

// Both child spawns share this budget now that they run together. The harness gives each its own
// internal kill timer — 20000ms for runInit (via runCommand), 3000ms for the import probe — so
// this only has to outlast the pair (run sequentially below), leaving the harness's timers to be
// what resolves a hang.
const SPAWNS_TIMEOUT_MS = 30_000;

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
      expect(init.exitCode).toBe(ExitCodeStub({ value: 0 }));
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
  let notBuiltResults: Record<SiegelenseCallName, Awaited<ReturnType<typeof harness.runCommand>>>;
  let bareHelp: Awaited<ReturnType<typeof harness.runCommand>>;
  let unknownSubcommand: Awaited<ReturnType<typeof harness.runCommand>>;

  beforeAll(async () => {
    const [helpEntries, notBuiltEntries, bareHelpResult, unknownSubcommandResult] =
      await Promise.all([
        Promise.all(
          BUILT_CALL_NAMES.map(
            async (call) =>
              [call, await harness.runCommand({ args: ['siegelense', call, '--help'] })] as const,
          ),
        ),
        Promise.all(
          NOT_BUILT_CALL_NAMES.map(
            async (name) =>
              [name, await harness.runCommand({ args: ['siegelense', name] })] as const,
          ),
        ),
        harness.runCommand({ args: ['siegelense', '--help'] }),
        harness.runCommand({ args: ['siegelense', 'statuss'] }),
      ]);

    helpResults = helpEntries.reduce<
      Record<BuiltSiegelenseCall, Awaited<ReturnType<typeof harness.runCommand>>>
    >(
      (accumulator, [call, result]) => ({ ...accumulator, [call]: result }),
      {} as Record<BuiltSiegelenseCall, Awaited<ReturnType<typeof harness.runCommand>>>,
    );
    notBuiltResults = notBuiltEntries.reduce<
      Record<SiegelenseCallName, Awaited<ReturnType<typeof harness.runCommand>>>
    >(
      (accumulator, [name, result]) => ({ ...accumulator, [name]: result }),
      {} as Record<SiegelenseCallName, Awaited<ReturnType<typeof harness.runCommand>>>,
    );
    bareHelp = bareHelpResult;
    unknownSubcommand = unknownSubcommandResult;
  }, SIEGELENSE_SEAM_TIMEOUT_MS);

  // The failure this catches: a call that is built, helped and routed in SiegelenseFlow but
  // refused by CliSiegelenseResponder before it ever gets there — the exact shape of the bug that
  // shipped `status` and `cleanup` fully tested and untypeable. Against a closed gate this would
  // exit 1 with "Unknown siegelense subcommand" on stderr and nothing on stdout, failing both
  // assertions below.
  it.each(BUILT_CALL_NAMES)(
    "VALID: {dungeonmaster siegelense %s --help} => exits 0 and stdout's first line is that call's summary",
    (call) => {
      expect(helpResults[call].exitCode).toBe(ExitCodeStub({ value: 0 }));
      expect(helpResults[call].stdout.split('\n')[0]).toBe(
        siegelenseHelpStatics.calls[call].summary,
      );
    },
  );

  it.each(NOT_BUILT_CALL_NAMES)(
    'INVALID: {dungeonmaster siegelense %s} => exits 1 and stderr names it as not built yet',
    (name) => {
      expect(notBuiltResults[name]).toStrictEqual({
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: '',
        stderr: `Error: ${name} ${NOT_BUILT_REFUSAL_SUFFIX}`,
      });
    },
  );

  it('VALID: {dungeonmaster siegelense --help} => exits 0 and prints the index page', () => {
    expect(bareHelp.exitCode).toBe(ExitCodeStub({ value: 0 }));
    expect(bareHelp.stdout.split('\n')[0]).toBe(siegelenseHelpStatics.index.headline);
  });

  it('INVALID: {dungeonmaster siegelense statuss} => exits 1 and names the unknown subcommand on stderr', () => {
    expect(unknownSubcommand).toStrictEqual({
      exitCode: ExitCodeStub({ value: 1 }),
      stdout: '',
      stderr: UNKNOWN_SUBCOMMAND_STDERR,
    });
  });
});

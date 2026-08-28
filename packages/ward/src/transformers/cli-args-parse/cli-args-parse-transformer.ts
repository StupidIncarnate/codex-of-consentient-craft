/**
 * PURPOSE: The one place ward decides whether a combination of CLI flags is legal. Both git scope
 * flags (`--changed`, `--staged`) are all-or-nothing: they own the whole run, so anything that would
 * narrow it — `--only`, `--onlyTests`, an explicit file list — is rejected here rather than silently
 * losing to whichever flag the broker happens to read last. `--onlyTests` runs the opposite risk —
 * it looks like a narrowing but scopes nothing, so it is rejected without a `-- <files>` list.
 *
 * USAGE:
 * cliArgsParseTransformer({ args: [CliArgStub({ value: '--only' }), CliArgStub({ value: 'lint,typecheck' })] });
 * // Returns: WardConfig { only: ['lint', 'typecheck'] }
 */

import type { CliArg } from '../../contracts/cli-arg/cli-arg-contract';
import {
  wardConfigContract,
  type WardConfig,
} from '../../contracts/ward-config/ward-config-contract';
import { checkTypeContract } from '../../contracts/check-type/check-type-contract';
import { wardSpawnCommandStatics } from '../../statics/ward-spawn-command/ward-spawn-command-statics';

const KNOWN_FLAGS = new Set(['--only', '--onlyTests', '--changed', '--staged', '--']);

const USAGE = `Usage: npm run ward -- [--only <check-types>] [-- <files>]\n       npm run ward -- [--only <check-types>] --onlyTests <regex> -- <files>\n       npm run ward -- --changed\n       npm run ward -- --staged`;

export const cliArgsParseTransformer = ({ args }: { args: CliArg[] }): WardConfig => {
  const parsed: Partial<WardConfig> = {};

  // A LOCAL BOOLEAN, NEVER A WardConfig FIELD. It answers one question — may `--onlyTests` stand
  // without a `-- <files>` list — and nothing downstream may route on it: the moment it became a
  // config field, `isFileScopeRequestedGuard` and `isExplicitPathScopeGuard` would each owe it a
  // classification it has no honest answer for, since it scopes nothing itself.
  const isParentScoped = args.some(
    (arg) => String(arg) === wardSpawnCommandStatics.parentScopedFlag,
  );

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--') {
      const rest = args.slice(i + 1).map(String);
      const flagsInPassthrough = rest.filter((value) => value.startsWith('-'));
      if (flagsInPassthrough.length > 0) {
        throw new Error(
          `Flags after "--" are not forwarded to underlying tools: ${flagsInPassthrough.join(', ')}\n\n` +
            `Everything after "--" is treated as file paths only.\n` +
            `Ward does not support passing flags to Jest, ESLint, tsc, or Playwright.\n\n` +
            `Usage: npm run ward -- --only unit -- path/to/file.test.ts`,
        );
      }
      if (rest.length > 0) {
        parsed.passthrough = rest.map((value) =>
          wardConfigContract.shape.passthrough.unwrap().element.parse(value),
        );
      }
      break;
    }

    if (arg === '--only') {
      if (args[i + 1]) {
        const raw = String(args[i + 1]).split(',');
        const expanded = raw.flatMap((value) =>
          value === 'test' ? ['unit', 'integration', 'e2e'] : [value],
        );
        const previous = parsed.only ?? [];
        const unique = [...new Set([...previous, ...expanded])];
        parsed.only = unique.map((value) => checkTypeContract.parse(value));
        i++;
      }
      continue;
    }

    if (arg === '--onlyTests') {
      if (args[i + 1]) {
        parsed.onlyTests = wardConfigContract.shape.onlyTests.unwrap().parse(String(args[i + 1]));
        i++;
      }
      continue;
    }

    if (arg === '--changed') {
      parsed.changed = true;
      continue;
    }

    if (arg === '--staged') {
      parsed.staged = true;
      continue;
    }

    if (String(arg) === wardSpawnCommandStatics.parentScopedFlag) {
      continue;
    }

    if (String(arg).startsWith('-')) {
      const flag = String(arg);
      throw new Error(
        `Unknown flag: ${flag}\n\nWard accepts only: ${[...KNOWN_FLAGS].filter((f) => f !== '--').join(', ')}\n\nCommon mistakes:\n` +
          `  - Jest flags (--watch, --bail, --coverage) are not supported\n` +
          `  - ESLint flags (--fix, --quiet, --format) are not supported\n` +
          `  - tsc flags (--noEmit, --project, --strict) are not supported\n` +
          `  - Playwright flags (--headed, --debug, --ui) are not supported\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${String(arg)}\n\n` +
        `File paths must come after "--" separator.\n` +
        `Usage: npm run ward -- --only unit -- path/to/file.test.ts`,
    );
  }

  if (parsed.changed === true && parsed.staged === true) {
    throw new Error(
      `--changed and --staged cannot be combined.\n\n` +
        `Each one picks the file set from git, so only one can decide the scope:\n` +
        `  --changed  files that differ from the local default branch\n` +
        `  --staged   files origin does not have yet — unpushed commits plus uncommitted edits\n\n${
          USAGE
        }`,
    );
  }

  if (parsed.changed === true || parsed.staged === true) {
    const gitScopeFlag = parsed.staged === true ? '--staged' : '--changed';
    const conflicting = [
      ...(parsed.only === undefined ? [] : ['--only']),
      ...(parsed.onlyTests === undefined ? [] : ['--onlyTests']),
      ...(parsed.passthrough === undefined ? [] : ['-- <files>']),
    ];

    if (conflicting.length > 0) {
      throw new Error(
        `${gitScopeFlag} cannot be combined with: ${conflicting.join(', ')}\n\n` +
          `${gitScopeFlag} runs every check type over the file set git reports. Narrowing it would ` +
          `let a check pass without ever seeing part of that set, so ward rejects the combination ` +
          `instead of picking a winner.\n\n` +
          `Run it alone, or scope the run yourself and drop ${gitScopeFlag}:\n` +
          `  npm run ward -- ${gitScopeFlag}\n` +
          `  npm run ward -- --only lint -- packages/ward/src/index.ts\n\n${USAGE}`,
      );
    }
  }

  // `--onlyTests` IS NOT A FILE SCOPE, and nothing downstream treats it as one: `filteredFolders`
  // in commandRunLayerMultiBroker narrows on `passthrough` alone, so an unscoped pattern spawns a
  // child ward in every workspace package, and the pattern only reaches Jest as
  // `--testNamePattern`, which filters at EXECUTION — after every test file in that package has
  // been collected and transformed. Measured: `--only unit --onlyTests "<4 tests>"` with no `--`
  // took 355s across 13 packages, 2560 files transformed, to run 4 tests; web and shared each paid
  // over two minutes to report `skip`. The file list is the only thing that keeps ward out of the
  // packages that cannot match.
  //
  // This sits AFTER the git scope checks on purpose: `--changed`/`--staged` already reject
  // `--onlyTests` outright, so those callers get the one error about the flag they actually typed
  // rather than a second one demanding a file list they are forbidden to pass.
  //
  // A CHILD WARD IS EXEMPT, and only a child: `commandRunLayerMultiBroker` spawns one per package
  // its own `filteredFolders` already picked, so the sweep this rule prevents cannot happen there,
  // and a whole-package arg (`-- packages/ward`) slices to an empty per-file list with nothing to
  // forward. The parent says so with `wardSpawnCommandStatics.parentScopedFlag`.
  if (parsed.onlyTests !== undefined && parsed.passthrough === undefined && !isParentScoped) {
    throw new Error(
      `--onlyTests requires a file scope: add -- <files>\n\n` +
        `--onlyTests is a test NAME filter, not a file filter. It reaches the test runner as ` +
        `--testNamePattern, which applies at execution — every package is still spawned and every ` +
        `test file in it collected and transformed before a single name is compared. Without a ` +
        `file list the whole monorepo pays that cost to run a handful of tests.\n\n` +
        `Name the files the tests live in:\n` +
        `  npm run ward -- --only unit --onlyTests "my test" -- packages/ward/src/foo.test.ts\n\n${
          USAGE
        }`,
    );
  }

  return wardConfigContract.parse(parsed);
};

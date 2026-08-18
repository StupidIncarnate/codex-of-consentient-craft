/**
 * PURPOSE: The one place ward decides whether a combination of CLI flags is legal. Both git scope
 * flags (`--changed`, `--staged`) are all-or-nothing: they own the whole run, so anything that would
 * narrow it — `--only`, `--onlyTests`, an explicit file list — is rejected here rather than silently
 * losing to whichever flag the broker happens to read last.
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

const KNOWN_FLAGS = new Set(['--only', '--onlyTests', '--changed', '--staged', '--']);

const USAGE = `Usage: npm run ward -- [--only <check-types>] [--onlyTests <regex>] [-- <files>]\n       npm run ward -- --changed\n       npm run ward -- --staged`;

export const cliArgsParseTransformer = ({ args }: { args: CliArg[] }): WardConfig => {
  const parsed: Partial<WardConfig> = {};

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

  return wardConfigContract.parse(parsed);
};

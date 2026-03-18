/**
 * PURPOSE: Parses CLI argument array into ward config flags (--only, --changed, --verbose)
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

const KNOWN_FLAGS = new Set(['--only', '--changed', '--verbose', '--']);

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

    if (arg === '--changed') {
      parsed.changed = true;
      continue;
    }

    if (arg === '--verbose') {
      parsed.verbose = true;
      continue;
    }

    if (String(arg).startsWith('-')) {
      const flag = String(arg);
      throw new Error(
        `Unknown flag: ${flag}\n\nWard accepts only: ${[...KNOWN_FLAGS].filter((f) => f !== '--').join(', ')}\n\nCommon mistakes:\n` +
          `  - Jest flags (--watch, --bail, --coverage, --verbose) are not supported\n` +
          `  - ESLint flags (--fix, --quiet, --format) are not supported\n` +
          `  - tsc flags (--noEmit, --project, --strict) are not supported\n` +
          `  - Playwright flags (--headed, --debug, --ui) are not supported\n\n` +
          `Usage: npm run ward -- [--only <check-types>] [--changed] [--verbose] [-- <files>]`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${String(arg)}\n\n` +
        `File paths must come after "--" separator.\n` +
        `Usage: npm run ward -- --only unit -- path/to/file.test.ts`,
    );
  }

  return wardConfigContract.parse(parsed);
};

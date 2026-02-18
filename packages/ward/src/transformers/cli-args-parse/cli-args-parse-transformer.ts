/**
 * PURPOSE: Parses CLI argument array into ward config flags (--only, --glob, --changed, --verbose)
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

export const cliArgsParseTransformer = ({ args }: { args: CliArg[] }): WardConfig => {
  const parsed: Partial<WardConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--') {
      const rest = args.slice(i + 1).map(String);
      if (rest.length > 0) {
        parsed.passthrough = rest.map((value) =>
          wardConfigContract.shape.passthrough.unwrap().element.parse(value),
        );
      }
      break;
    }

    if (arg === '--only' && args[i + 1]) {
      parsed.only = String(args[i + 1])
        .split(',')
        .map((value) => checkTypeContract.parse(value));
      i++;
    }

    if (arg === '--glob' && args[i + 1]) {
      parsed.glob = wardConfigContract.shape.glob.parse(String(args[i + 1]));
      i++;
    }

    if (arg === '--changed') {
      parsed.changed = true;
    }

    if (arg === '--verbose') {
      parsed.verbose = true;
    }
  }

  return wardConfigContract.parse(parsed);
};

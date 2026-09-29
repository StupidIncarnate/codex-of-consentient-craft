/**
 * PURPOSE: Turns the words after `ward scan` into a ScanConfig and rejects every other shape with
 * the usage line. Reach for this over `cliArgsParseTransformer`, whose flags describe check runs
 * and which has no notion of a rule to scan.
 *
 * USAGE:
 * scanArgsParseTransformer({ args: [CliArgStub({ value: 'no-console' }), CliArgStub({ value: '--' }), CliArgStub({ value: 'packages/ward' })] });
 * // Returns: ScanConfig { rule: 'no-console', paths: ['packages/ward'] }
 */

import type { CliArg } from '../../contracts/cli-arg/cli-arg-contract';
import {
  scanConfigContract,
  type ScanConfig,
} from '../../contracts/scan-config/scan-config-contract';

const SEPARATOR = '--';

const USAGE = 'Usage: npm run ward -- scan <rule> [-- <files or packages>]';

export const scanArgsParseTransformer = ({ args }: { args: CliArg[] }): ScanConfig => {
  const [rule, ...rest] = args.map(String);

  if (rule === undefined || rule.startsWith('-')) {
    throw new Error(`scan needs a rule name first.\n${USAGE}`);
  }

  const separatorIndex = rest.indexOf(SEPARATOR);
  const beforeSeparator = separatorIndex === -1 ? rest : rest.slice(0, separatorIndex);

  if (beforeSeparator.length > 0) {
    throw new Error(
      `scan takes one rule; unexpected argument(s): ${beforeSeparator.join(', ')}\n${USAGE}`,
    );
  }

  const paths = separatorIndex === -1 ? [] : rest.slice(separatorIndex + 1);
  const flagsAfterSeparator = paths.filter((path) => path.startsWith('-'));

  if (flagsAfterSeparator.length > 0) {
    throw new Error(
      `Flags after "--" are not forwarded: ${flagsAfterSeparator.join(', ')}\n${USAGE}`,
    );
  }

  return scanConfigContract.parse({ rule, paths });
};

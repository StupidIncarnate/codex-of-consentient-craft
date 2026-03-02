/**
 * PURPOSE: Parses CLI args and delegates to the command run broker for executing ward checks
 *
 * USAGE:
 * await WardRunResponder({ args: ['node', 'ward', 'run', '--only', 'lint'], rootPath: AbsoluteFilePathStub() });
 * // Parses flags and runs all configured checks
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { cliArgContract } from '../../../contracts/cli-arg/cli-arg-contract';
import { cliArgsParseTransformer } from '../../../transformers/cli-args-parse/cli-args-parse-transformer';
import { commandRunBroker } from '../../../brokers/command/run/command-run-broker';

const FIRST_POSITIONAL_INDEX = 3;

export const WardRunResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<void> => {
  const cliArgs = args.slice(FIRST_POSITIONAL_INDEX).map((arg) => cliArgContract.parse(arg));
  const config = cliArgsParseTransformer({ args: cliArgs });
  await commandRunBroker({ config, rootPath });
};

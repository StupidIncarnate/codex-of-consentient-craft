#!/usr/bin/env node

/**
 * PURPOSE: CLI entry point for the ward command that routes to run/list/detail/raw subcommands
 *
 * USAGE:
 * ward              // Runs all checks (default: run)
 * ward list         // Lists errors by file from most recent run
 * ward detail <run-id> <file-path>  // Shows detailed errors for a file
 * ward raw <run-id> <check-type>    // Shows raw output for a check
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  exitCodeContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import { projectRootFindBroker } from '@dungeonmaster/shared/brokers';

import { cliArgContract } from '../contracts/cli-arg/cli-arg-contract';
import { runIdContract } from '../contracts/run-id/run-id-contract';
import { checkTypeContract } from '../contracts/check-type/check-type-contract';
import { errorEntryContract } from '../contracts/error-entry/error-entry-contract';
import { cliArgsParseTransformer } from '../transformers/cli-args-parse/cli-args-parse-transformer';
import { commandRunBroker } from '../brokers/command/run/command-run-broker';
import { commandListBroker } from '../brokers/command/list/command-list-broker';
import { commandDetailBroker } from '../brokers/command/detail/command-detail-broker';
import { commandRawBroker } from '../brokers/command/raw/command-raw-broker';

const COMMAND_ARG_INDEX = 2;
const FIRST_POSITIONAL_INDEX = 3;
const SECOND_POSITIONAL_INDEX = 4;

const COMMANDS = {
  run: 'run',
  list: 'list',
  detail: 'detail',
  raw: 'raw',
} as const;

export const StartWard = async ({ args }: { args: string[] }): Promise<void> => {
  const command = args[COMMAND_ARG_INDEX] ?? COMMANDS.run;
  const cwd = absoluteFilePathContract.parse(process.cwd());
  const startPath = filePathContract.parse(cwd);
  const rootPath = await projectRootFindBroker({ startPath });
  const resolvedRootPath = absoluteFilePathContract.parse(rootPath);

  const gitResult = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', '--show-toplevel'],
    cwd,
  });

  const gitRoot =
    gitResult.exitCode === exitCodeContract.parse(0)
      ? absoluteFilePathContract.parse(gitResult.output.trim())
      : resolvedRootPath;

  const isSubPackage = resolvedRootPath !== gitRoot;

  if (command === COMMANDS.run) {
    const cliArgs = args.slice(FIRST_POSITIONAL_INDEX).map((arg) => cliArgContract.parse(arg));
    const config = cliArgsParseTransformer({ args: cliArgs });
    await commandRunBroker({ config, rootPath: resolvedRootPath, isSubPackage });
    return;
  }

  if (command === COMMANDS.list) {
    const runIdArg = args[FIRST_POSITIONAL_INDEX];
    const runId = runIdArg ? runIdContract.parse(runIdArg) : undefined;
    const loadArgs = runId ? { rootPath: resolvedRootPath, runId } : { rootPath: resolvedRootPath };
    await commandListBroker(loadArgs);
    return;
  }

  if (command === COMMANDS.detail) {
    const runIdArg = args[FIRST_POSITIONAL_INDEX];
    const filePathArg = args[SECOND_POSITIONAL_INDEX];

    if (!runIdArg || !filePathArg) {
      process.stderr.write('Usage: ward detail <run-id> <file-path> [--verbose]\n');
      return;
    }

    const runId = runIdContract.parse(runIdArg);
    const filePath = errorEntryContract.shape.filePath.parse(filePathArg);
    const cliArgs = args.slice(SECOND_POSITIONAL_INDEX + 1).map((arg) => cliArgContract.parse(arg));
    const flags = cliArgsParseTransformer({ args: cliArgs });
    const detailArgs = flags.verbose
      ? { rootPath: resolvedRootPath, runId, filePath, verbose: flags.verbose }
      : { rootPath: resolvedRootPath, runId, filePath };
    await commandDetailBroker(detailArgs);
    return;
  }

  if (command === COMMANDS.raw) {
    const runIdArg = args[FIRST_POSITIONAL_INDEX];
    const checkTypeArg = args[SECOND_POSITIONAL_INDEX];

    if (!runIdArg || !checkTypeArg) {
      process.stderr.write('Usage: ward raw <run-id> <check-type>\n');
      return;
    }

    const runId = runIdContract.parse(runIdArg);
    const checkType = checkTypeContract.parse(checkTypeArg);
    await commandRawBroker({ rootPath: resolvedRootPath, runId, checkType });
    return;
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.stderr.write('Available commands: run, list, detail, raw\n');
};

const isDirectExecution = process.argv[1] !== undefined && __filename.includes('start-ward');

if (isDirectExecution) {
  StartWard({ args: process.argv }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  });
}

/**
 * PURPOSE: CLI entry point for ward quality checks that delegates to the ward flow
 *
 * USAGE:
 * await StartWard({ args: process.argv });
 * // Delegates to WardFlow for command routing
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { WardFlow } from '../flows/ward/ward-flow';

export const StartWard = async ({ args }: { args: readonly string[] }): Promise<void> => {
  const rootPath = absoluteFilePathContract.parse(process.cwd());
  await WardFlow({ args, rootPath });
};

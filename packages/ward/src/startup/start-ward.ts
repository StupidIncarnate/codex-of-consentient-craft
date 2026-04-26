/**
 * PURPOSE: CLI entry point for ward quality checks that delegates to the ward flow
 *
 * USAGE:
 * await StartWard({ args: process.argv });
 * // Delegates to WardFlow for command routing
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

import { WardFlow } from '../flows/ward/ward-flow';

export const StartWard = async ({ args }: { args: readonly string[] }): Promise<AdapterResult> => {
  const rootPath = absoluteFilePathContract.parse(processCwdAdapter());
  return WardFlow({ args, rootPath });
};

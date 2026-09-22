/**
 * PURPOSE: The `cleanup` call's own entry — parses argv into a `CleanupArgs` and hands it straight
 * to `SiegelenseCleanupResponder`. `cleanup` takes no input beyond `--json`
 * (`cleanup-args-parse-transformer.ts`'s own header), so this layer composes exactly the two steps
 * the call requires: parse, then respond. `siegelense-flow.ts` routes `cleanup` here.
 *
 * USAGE:
 * await SiegelenseCleanupLayerFlow({ callArgs: ['--json'] });
 * // Reaps every stale registry row, releases its ports/lock, ages assets out on cleanup's own
 * // per-kind windows, and returns the AdapterResult SiegelenseCleanupResponder resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseCleanupResponder } from '../../responders/siegelense/cleanup/siegelense-cleanup-responder';
import { cleanupArgsParseTransformer } from '../../transformers/cleanup-args-parse/cleanup-args-parse-transformer';

export const SiegelenseCleanupLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> =>
  SiegelenseCleanupResponder(cleanupArgsParseTransformer({ args: callArgs }));

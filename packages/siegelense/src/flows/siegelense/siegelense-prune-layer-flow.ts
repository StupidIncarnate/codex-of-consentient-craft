/**
 * PURPOSE: The `prune` call's own entry — parses argv into a `PruneArgs`, reads `--confirm` off the
 * same argv, and hands both straight to `SiegelensePruneResponder`. `--confirm` carries no selector
 * (it decides whether the call is ALLOWED to delete, not WHAT it selects), so it stays out of
 * `PruneArgs` and is read here instead — the one place that already holds the raw argv
 * (`siegelense-prune-responder.ts`'s own header explains the default it drives). `siegelense-flow.ts`
 * routes `prune` here.
 *
 * USAGE:
 * await SiegelensePruneLayerFlow({ callArgs: ['--kind', 'shot', '--older-than', '0s'] });
 * // A dry run: prints what WOULD be deleted and deletes nothing
 *
 * await SiegelensePruneLayerFlow({
 *   callArgs: ['--kind', 'shot', '--older-than', '0s', '--confirm'],
 * });
 * // Deletes every shot past the window and returns the AdapterResult SiegelensePruneResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelensePruneResponder } from '../../responders/siegelense/prune/siegelense-prune-responder';
import { pruneStatics } from '../../statics/prune/prune-statics';
import { pruneArgsParseTransformer } from '../../transformers/prune-args-parse/prune-args-parse-transformer';

export const SiegelensePruneLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> => {
  const args = pruneArgsParseTransformer({ args: callArgs });
  const confirm = callArgs.includes(pruneStatics.flags.confirm);
  return SiegelensePruneResponder({ ...args, confirm });
};

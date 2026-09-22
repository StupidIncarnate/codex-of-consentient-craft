/**
 * PURPOSE: The `kill` entry point lifted out of `siegelense-flow.ts`'s `CALL_ROUTES` map into its
 * own layer file, so `dungeonmaster siegelense kill`'s whole argv-to-responder wiring has one home
 * rather than one line inside a router thirteen calls wide. Parses argv through
 * `killArgsParseTransformer` — the one place that owns `kill`'s known-flag set (`--instance`,
 * `--json`) and every one of its refusals (missing id, badly-shaped id) — then hands the typed
 * `KillArgs` straight to `SiegelenseKillResponder`. Carries no branching of its own: the
 * already-dead-id acceptance and the unknown-id refusal both live in the responder, never here.
 *
 * USAGE:
 * await SiegelenseKillLayerFlow({ callArgs: ['--instance', 'inst_7f3a9c21'] });
 * // Parses argv, then routes to SiegelenseKillResponder
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseKillResponder } from '../../responders/siegelense/kill/siegelense-kill-responder';
import { killArgsParseTransformer } from '../../transformers/kill-args-parse/kill-args-parse-transformer';

export const SiegelenseKillLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> => SiegelenseKillResponder(killArgsParseTransformer({ args: callArgs }));

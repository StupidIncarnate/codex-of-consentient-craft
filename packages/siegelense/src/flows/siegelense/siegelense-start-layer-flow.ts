/**
 * PURPOSE: The `start` entry point for `dungeonmaster siegelense` — reads its argv into a `StartArgs`
 * via `startArgsParseTransformer` and hands the result straight to `SiegelenseStartResponder`, which
 * boots the instance and writes the `InstanceManifest` to stdout. Carries no logic of its own beyond
 * that one call — every refusal (a missing `--spec`, a badly-shaped flag value, an unrecognised
 * token) is `startArgsParseTransformer`'s own, and every boot decision (capacity, the lane spec
 * lookup, the driver spawn itself) belongs to `instanceStartBroker`, reached through the responder.
 * `siegelense-flow.ts`'s own `CALL_ROUTES` entry for `start` is this same call, lifted here as its own
 * file per the one-flow-file-per-entry-point convention.
 *
 * USAGE:
 * await SiegelenseStartLayerFlow({ callArgs: ['--spec', 'dungeonmaster-stack'] });
 * // Boots an instance for that spec and writes its InstanceManifest to stdout
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseStartResponder } from '../../responders/siegelense/start/siegelense-start-responder';
import { startArgsParseTransformer } from '../../transformers/start-args-parse/start-args-parse-transformer';

export const SiegelenseStartLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> =>
  SiegelenseStartResponder(startArgsParseTransformer({ args: callArgs }));

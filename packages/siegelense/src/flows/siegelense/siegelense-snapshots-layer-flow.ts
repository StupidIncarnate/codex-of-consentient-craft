/**
 * PURPOSE: The `snapshots` call's own entry — parses argv into a `SnapshotsArgs` and hands it
 * straight to `SiegelenseSnapshotsResponder`. `snapshots` starts nothing and needs no branching
 * beyond that (`siegelense-snapshots-responder.ts`'s own header), so this layer composes exactly the
 * two steps the call requires: parse, then respond. `siegelense-flow.ts` routes `snapshots` here.
 *
 * USAGE:
 * await SiegelenseSnapshotsLayerFlow({ callArgs: ['--instance', 'inst_7f3a9c21'] });
 * // Parses the argv into SnapshotsArgs and returns the AdapterResult SiegelenseSnapshotsResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseSnapshotsResponder } from '../../responders/siegelense/snapshots/siegelense-snapshots-responder';
import { snapshotsArgsParseTransformer } from '../../transformers/snapshots-args-parse/snapshots-args-parse-transformer';

export const SiegelenseSnapshotsLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> =>
  SiegelenseSnapshotsResponder(snapshotsArgsParseTransformer({ args: callArgs }));

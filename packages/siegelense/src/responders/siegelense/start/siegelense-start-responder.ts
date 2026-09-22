/**
 * PURPOSE: The surface `dungeonmaster siegelense start --spec <name> [--quest <id>] [--guild <id>]`
 * serves — stands up a fresh instance and writes the resulting `InstanceManifest` to stdout, per
 * §3.A of `scrolls/seigelense/plans/chunk-04-cli-surface.md`: every one of the seven calls writes
 * exactly one document to stdout, or nothing at all. `start` prints a human summary by default,
 * through `startAnswerRenderTransformer`, same as `status`/`cleanup`, and the raw `InstanceManifest`
 * as JSON with `--json` (`isJson: true`) — a failure from `instanceStartBroker` propagates unchanged
 * rather than being caught into a `{success:false}` document here; the CLI entry point turns an
 * uncaught throw into stderr text and exit 1.
 *
 * USAGE:
 * await SiegelenseStartResponder({ specName: SpecNameStub(), questId: null, guildId: null, seed: null });
 * // Writes the human summary to stdout
 *
 * await SiegelenseStartResponder({
 *   specName: SpecNameStub(),
 *   questId: null,
 *   guildId: null,
 *   seed: RecipeNameStub({ value: 'guild-with-three-quests' }),
 *   idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }),
 * });
 * // Same, but the driver it spawns serves the raised ceiling instead of driverStatics.idle.timeoutMs
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, GuildId, QuestId, TimeoutMs } from '@dungeonmaster/shared/contracts';

import type { RecipeName } from '../../../contracts/recipe-name/recipe-name-contract';

import { instanceStartBroker } from '../../../brokers/instance/start/instance-start-broker';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { startAnswerRenderTransformer } from '../../../transformers/start-answer-render/start-answer-render-transformer';

export const SiegelenseStartResponder = async ({
  specName,
  questId,
  guildId,
  seed,
  idleTimeoutMs,
  isJson = false,
}: {
  specName: SpecName;
  questId: QuestId | null;
  guildId: GuildId | null;
  seed: RecipeName | null;
  // `| undefined`, not bare `?:`, because this is called with a whole `StartArgs` object —
  // `startArgsContract`'s own `.optional()` field infers as `TimeoutMs | undefined`, and
  // `exactOptionalPropertyTypes` refuses a narrower `idleTimeoutMs?: TimeoutMs` as an incompatible
  // target for that wider source type.
  idleTimeoutMs?: TimeoutMs | undefined;
  isJson?: boolean | undefined;
}): Promise<AdapterResult> => {
  const manifest = await instanceStartBroker(
    idleTimeoutMs === undefined
      ? { specName, questId, guildId, seed }
      : { specName, questId, guildId, seed, idleTimeoutMs },
  );
  process.stdout.write(
    isJson
      ? `${JSON.stringify(manifest, null, siegelenseOutputStatics.json.indentSpaces)}\n`
      : startAnswerRenderTransformer({ manifest }),
  );
  return adapterResultContract.parse({ success: true });
};

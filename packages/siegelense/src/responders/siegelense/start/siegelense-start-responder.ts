/**
 * PURPOSE: The surface `dungeonmaster siegelense start --spec <name> [--quest <id>] [--guild <id>]`
 * serves — stands up a fresh instance and writes the resulting `InstanceManifest` to stdout as one
 * JSON document, per §3.A of `scrolls/seigelense/plans/chunk-04-cli-surface.md`: every one of the
 * seven calls writes exactly one JSON document to stdout, or nothing at all. `start` has no
 * `--human` renderer — unlike `status`/`cleanup`, the manifest prints as JSON always — so a failure
 * from `instanceStartBroker` propagates unchanged rather than being caught into a `{success:false}`
 * document here; the CLI entry point turns an uncaught throw into stderr text and exit 1.
 *
 * USAGE:
 * await SiegelenseStartResponder({ specName: SpecNameStub(), questId: null, guildId: null });
 * // Writes the InstanceManifest as one JSON document to stdout
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { instanceStartBroker } from '../../../brokers/instance/start/instance-start-broker';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

export const SiegelenseStartResponder = async ({
  specName,
  questId,
  guildId,
}: {
  specName: SpecName;
  questId: QuestId | null;
  guildId: GuildId | null;
}): Promise<AdapterResult> => {
  const manifest = await instanceStartBroker({ specName, questId, guildId });
  process.stdout.write(
    `${JSON.stringify(manifest, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );
  return adapterResultContract.parse({ success: true });
};

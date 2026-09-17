/**
 * PURPOSE: The surface `dungeonmaster siegelense capacity [--spec <specName>] [--pool <n>]` serves —
 * one JSON document on stdout, the raw `CapacityAnswer`. Writes through `process.stdout.write`,
 * never `console.log`, matching `SiegelenseProfileResponder`. There is no `human` parameter and no
 * renderer behind one: the answer is five fields with a sentence already in it, and `SiegelenseFlow`
 * refuses `--human` by name for any call whose own help entry carries no such flag, so the opt-out
 * needs nothing here. Starts no instance — `capacityReadBroker` resolves everything off the
 * registry, the host and the asset tree.
 *
 * USAGE:
 * await SiegelenseCapacityResponder({ specName: null, poolSize: null });
 * // Writes the CapacityAnswer for the default spec as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { capacityReadBroker } from '../../../brokers/capacity/read/capacity-read-broker';
import type { ProfilePoolSize } from '../../../contracts/profile-pool-size/profile-pool-size-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

export const SiegelenseCapacityResponder = async ({
  specName,
  poolSize,
}: {
  specName: SpecName | null;
  poolSize: ProfilePoolSize | null;
}): Promise<AdapterResult> => {
  const answer = await capacityReadBroker({ specName, poolSize });

  process.stdout.write(
    `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );

  return adapterResultContract.parse({ success: true });
};

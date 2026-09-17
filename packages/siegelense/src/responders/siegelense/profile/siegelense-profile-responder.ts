/**
 * PURPOSE: The surface `dungeonmaster siegelense profile --spec <specName>` serves — one JSON
 * document on stdout, the raw `SpecProfile`. Writes through `process.stdout.write`, never
 * `console.log`, matching `SiegelenseStatusResponder`. There is no `human` parameter and no renderer
 * behind one: `profile` answers a shape `capacity` consumes, and `SiegelenseFlow` refuses `--human`
 * by name for any call whose own help entry carries no such flag, so the opt-out needs nothing here.
 * Starts no instance — `profileReadBroker` resolves everything off the asset tree.
 *
 * USAGE:
 * await SiegelenseProfileResponder({ specName: SpecNameStub({ value: 'dungeonmaster-web' }) });
 * // Writes that spec's SpecProfile as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { profileReadBroker } from '../../../brokers/profile/read/profile-read-broker';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

export const SiegelenseProfileResponder = async ({
  specName,
}: {
  specName: SpecName;
}): Promise<AdapterResult> => {
  const profile = await profileReadBroker({ specName });

  process.stdout.write(
    `${JSON.stringify(profile, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );

  return adapterResultContract.parse({ success: true });
};

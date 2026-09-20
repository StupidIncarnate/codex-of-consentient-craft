/**
 * PURPOSE: Resolves where one instance's evidence lives, partitioned by the GUILD THAT OWNS THE
 * QUEST the instance was started for — never a guild a recipe seeds fresh inside its own throwaway
 * home on every run, which would file every instance under a partition of its own. Deleting a guild
 * takes exactly that guild's siege evidence and reaches no other guild's. `guildId: null` is not a
 * degraded case: a session nobody orchestrated drives this tool too and has no quest and therefore no
 * guild, so its evidence files under `unowned/` — a real partition no guild wipe can reach, where an
 * instance filed under a guild id that no guild has would read as corruption instead.
 *
 * USAGE:
 * locationsInstanceEvidencePathFindBroker({ instanceId, guildId: someGuildId });
 * // Returns AbsoluteFilePath '<root>/guilds/<guildId>/instances/<instanceId>'
 *
 * locationsInstanceEvidencePathFindBroker({ instanceId, guildId: null });
 * // Returns AbsoluteFilePath '<root>/unowned/instances/<instanceId>'
 */

import { locationsRootPathFindBroker } from '../root-path-find/locations-root-path-find-broker';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
  type GuildId,
} from '@dungeonmaster/shared/contracts';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';

export const locationsInstanceEvidencePathFindBroker = ({
  instanceId,
  guildId,
}: {
  instanceId: InstanceId;
  guildId: GuildId | null;
}): AbsoluteFilePath => {
  const rootPath = locationsRootPathFindBroker();

  const joined =
    guildId === null
      ? pathJoinAdapter({
          paths: [
            rootPath,
            locationsStatics.siegelense.unownedDir,
            locationsStatics.siegelense.instancesDir,
            instanceId,
          ],
        })
      : pathJoinAdapter({
          paths: [
            rootPath,
            locationsStatics.siegelense.guildsDir,
            guildId,
            locationsStatics.siegelense.instancesDir,
            instanceId,
          ],
        });

  return absoluteFilePathContract.parse(joined);
};

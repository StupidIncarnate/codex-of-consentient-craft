/**
 * PURPOSE: Resolves the absolute path to the usage-ledger.json.tmp staging file used for atomic
 *   rename writes. Reach for this over the ledger path itself whenever WRITING: the ledger is
 *   rewritten on every scan and read by a separate poll, so a partial write would be parsed as a
 *   corrupt ledger and reset the whole week's measurement.
 *
 *   `token` MUST be unique to the writer, and the caller owns choosing it — the dungeonmaster home
 *   is shared by every process on the machine, so two scans staging under one name is a lost race
 *   that surfaces as `ENOENT ... rename` on whichever one renames second, and a 500 from
 *   GET /api/rate-limits. The cost of uniqueness is that a process killed between the write and the
 *   rename leaves its staging file behind instead of having it overwritten.
 *
 * USAGE:
 * locationsUsageLedgerTmpPathFindBroker({ token: '4821-1789337123234' });
 * // Returns AbsoluteFilePath '<dmHome>/usage-ledger.json.tmp.4821-1789337123234'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsUsageLedgerTmpPathFindBroker = ({
  token,
}: {
  token: string;
}): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, `${locationsStatics.dungeonmasterHome.usageLedgerTmp}.${token}`],
  });

  return absoluteFilePathContract.parse(joined);
};

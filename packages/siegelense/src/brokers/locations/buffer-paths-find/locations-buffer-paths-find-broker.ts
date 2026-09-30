/**
 * PURPOSE: Resolves the three per-instance buffer files `results` reads back — console, network and
 * websocket entries flushed continuously across the instance's whole life, never reset per run
 * (chunk-03-read-path-and-perception.md §3.A: three append-only files per INSTANCE, at the instance
 * evidence root beside `api-server.log`). Reach for this over `locationsRunPathsFindBroker`: a run's
 * paths are namespaced by run id because step numbering restarts at 1 per run, while these three sit
 * directly under `evidencePath` because they outlive any one run.
 *
 * USAGE:
 * locationsBufferPathsFindBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1' }),
 * });
 * // Returns {
 * //   console: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/console.jsonl',
 * //   network: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/network.jsonl',
 * //   websocket: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/ws.jsonl',
 * // }
 */

import { locationsBufferPathsFindResultContract } from '../../../contracts/locations-buffer-paths-find-result/locations-buffer-paths-find-result-contract';
import type { LocationsBufferPathsFindResult } from '../../../contracts/locations-buffer-paths-find-result/locations-buffer-paths-find-result-contract';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export const locationsBufferPathsFindBroker = ({
  evidencePath,
}: {
  evidencePath: string;
}): LocationsBufferPathsFindResult => {
  const consolePath = join(evidencePath, locationsStatics.siegelense.consoleLog);

  const networkPath = join(evidencePath, locationsStatics.siegelense.networkLog);

  const websocketPath = join(evidencePath, locationsStatics.siegelense.websocketLog);

  return locationsBufferPathsFindResultContract.parse({
    console: consolePath,
    network: networkPath,
    websocket: websocketPath,
  });
};

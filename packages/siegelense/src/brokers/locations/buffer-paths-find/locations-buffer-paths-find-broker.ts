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
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/guilds/g1/instances/inst_1' }),
 * });
 * // Returns {
 * //   console: '/repo/.siegelense/guilds/g1/instances/inst_1/console.jsonl',
 * //   network: '/repo/.siegelense/guilds/g1/instances/inst_1/network.jsonl',
 * //   websocket: '/repo/.siegelense/guilds/g1/instances/inst_1/ws.jsonl',
 * // }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const locationsBufferPathsFindBroker = ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): {
  console: AbsoluteFilePath;
  network: AbsoluteFilePath;
  websocket: AbsoluteFilePath;
} => {
  const consolePath = pathJoinAdapter({
    paths: [evidencePath, locationsStatics.siegelense.consoleLog],
  });

  const networkPath = pathJoinAdapter({
    paths: [evidencePath, locationsStatics.siegelense.networkLog],
  });

  const websocketPath = pathJoinAdapter({
    paths: [evidencePath, locationsStatics.siegelense.websocketLog],
  });

  return {
    console: absoluteFilePathContract.parse(consolePath),
    network: absoluteFilePathContract.parse(networkPath),
    websocket: absoluteFilePathContract.parse(websocketPath),
  };
};

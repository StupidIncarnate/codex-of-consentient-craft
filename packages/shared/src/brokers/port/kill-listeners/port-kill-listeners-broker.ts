/**
 * PURPOSE: Lists what is listening on a port and kills every one of them. Composes
 * #gateway/bin/lsof's listeningPids with #gateway/bin/kill's killPid — the gateway keeps the two as
 * separate wrappers per its one-module-per-program rule, so combining them for "clear this port" is
 * business logic that belongs here, not in the gateway itself.
 *
 * USAGE:
 * const results = await portKillListenersBroker({ port: NetworkPortStub({ value: 49555 }) });
 * // Kills every process listening on port 49555; each entry is killPid's own exitCode/output for
 * // that pid — an empty array means nothing was listening
 */

import { killPid } from '#gateway/bin/kill';
import { listeningPids } from '#gateway/bin/lsof';

import {
  portKillListenerResultContract,
  type PortKillListenerResult,
} from '../../../contracts/port-kill-listener-result/port-kill-listener-result-contract';

export const portKillListenersBroker = async ({
  port,
}: {
  port: number;
}): Promise<PortKillListenerResult[]> => {
  const pids = await listeningPids({ port });

  return Promise.all(
    pids.map(async (pid) => {
      const { exitCode, output } = await killPid({ pid });
      return portKillListenerResultContract.parse({ pid, exitCode, output });
    }),
  );
};

/**
 * PURPOSE: Renders a `KillResult` into a concise, token-efficient human summary for the
 * `dungeonmaster siegelense kill` CLI surface — instance id, reaped process count and list,
 * and whether the throwaway home was removed or preserved. Pure, so the rendered summary is
 * provable without stdout.
 *
 * A repeat kill (`alreadyKilledAtMs` present) says so and claims no reap, so it cannot be read as
 * a first kill.
 *
 * USAGE:
 * killAnswerRenderTransformer({ result: KillResultStub() });
 * // Returns 'KILLED: inst_7f3a9c21\nPROCESSES REAPED: 0 (none)\nHOME: removed\n'
 */

import type { KillResult } from '../../contracts/kill-result/kill-result-contract';

export const killAnswerRenderTransformer = ({ result }: { result: KillResult }): string => {
  if (result.alreadyKilledAtMs !== undefined) {
    const when =
      result.alreadyKilledAtMs === null
        ? 'an unrecorded time'
        : new Date(result.alreadyKilledAtMs).toISOString();
    return [
      `${result.instanceId}: already killed at ${when}; nothing to do`,
      'HOME: already removed',
      '',
    ].join('\n');
  }

  const killed = result.killed ?? result.reapedPgids;
  const killedList = killed.length === 0 ? 'none' : killed.join(', ');
  const homeStatus = result.homeRemoved ? 'removed' : 'preserved';

  return [
    `KILLED: ${result.instanceId}`,
    `PROCESSES REAPED: ${killed.length} (${killedList})`,
    `HOME: ${homeStatus}`,
    '',
  ].join('\n');
};

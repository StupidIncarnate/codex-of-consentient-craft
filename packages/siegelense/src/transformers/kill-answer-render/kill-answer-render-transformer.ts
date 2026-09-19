/**
 * PURPOSE: Renders a `KillResult` into a concise, token-efficient human summary for the
 * `dungeonmaster siegelense kill` CLI surface — instance id, reaped process count and list,
 * and whether the throwaway home was removed or preserved. Pure, so the rendered summary is
 * provable without stdout.
 *
 * USAGE:
 * killAnswerRenderTransformer({ result: KillResultStub() });
 * // Returns 'KILLED: inst_7f3a9c21\nPROCESSES REAPED: 0 (none)\nHOME: removed\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { KillResult } from '../../contracts/kill-result/kill-result-contract';

export const killAnswerRenderTransformer = ({ result }: { result: KillResult }): ContentText => {
  const killed = result.killed ?? result.reapedPgids;
  const killedList = killed.length === 0 ? 'none' : killed.join(', ');
  const homeStatus = result.homeRemoved ? 'removed' : 'preserved';

  return contentTextContract.parse(
    [
      `KILLED: ${result.instanceId}`,
      `PROCESSES REAPED: ${killed.length} (${killedList})`,
      `HOME: ${homeStatus}`,
      '',
    ].join('\n'),
  );
};

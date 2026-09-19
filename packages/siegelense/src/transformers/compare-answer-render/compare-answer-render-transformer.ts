/**
 * PURPOSE: Renders a `CompareAnswer` into a concise, token-efficient human summary for the
 * `dungeonmaster siegelense compare` CLI surface — instance id, runs compared, error deltas across
 * console, server, and network, and the pixel diff summary. Pure, so the rendered summary is
 * provable without stdout.
 *
 * USAGE:
 * compareAnswerRenderTransformer({ answer: CompareAnswerStub() });
 * // Returns 'INSTANCE: inst_7f3a9c21\nCOMPARING: run_4 -> run_5\nCONSOLE ERRORS: +2\nSERVER ERRORS: +0\nNETWORK NON-2XX: +1\nPIXEL DELTA: last capture differs 12%\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { CompareAnswer } from '../../contracts/compare-answer/compare-answer-contract';

export const compareAnswerRenderTransformer = ({
  answer,
}: {
  answer: CompareAnswer;
}): ContentText => {
  const consoleDelta =
    answer.consoleErrorDelta === undefined
      ? answer.console.errors
      : `${answer.consoleErrorDelta >= 0 ? '+' : ''}${answer.consoleErrorDelta}`;

  const serverDelta =
    answer.serverErrorDelta === undefined
      ? answer.server.errors
      : `${answer.serverErrorDelta >= 0 ? '+' : ''}${answer.serverErrorDelta}`;

  const networkDelta =
    answer.networkNon2xxDelta === undefined
      ? answer.network.errors
      : `${answer.networkNon2xxDelta >= 0 ? '+' : ''}${answer.networkNon2xxDelta}`;

  const pixelDelta =
    answer.pixelDiffCount === undefined
      ? (answer.pixels ?? 'none')
      : `${answer.pixelDiffCount} pixels changed`;

  return contentTextContract.parse(
    [
      `INSTANCE: ${answer.instanceId}`,
      `COMPARING: ${answer.runA} -> ${answer.runB}`,
      `CONSOLE ERRORS: ${consoleDelta}`,
      `SERVER ERRORS: ${serverDelta}`,
      `NETWORK NON-2XX: ${networkDelta}`,
      `PIXEL DELTA: ${pixelDelta}`,
      '',
    ].join('\n'),
  );
};

/**
 * PURPOSE: Renders a `RunResult` into the concise, token-efficient human view an operator or agent
 * reads at a terminal after running a step batch — the run id, status, step count and duration on the
 * first line, followed by the failure point if stopped early, and captured screenshots when present.
 * Pure, keeping human formatting separated from the execution broker and the CLI responder.
 *
 * USAGE:
 * runAnswerRenderTransformer({ result: RunResultStub() });
 * // Returns 'RUN: run_1 (status: done, steps: 5, duration: 0ms)\n...'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { RunResult } from '../../contracts/run-result/run-result-contract';

export const runAnswerRenderTransformer = ({ result }: { result: RunResult }): ContentText => {
  const stoppedText =
    result.stoppedAt === null
      ? ''
      : `\nSTOPPED AT: step ${result.stoppedAt.step} (${result.stoppedAt.verb}) — ${result.stoppedAt.error}`;

  const screenshotsText =
    result.shots.length === 0
      ? ''
      : `\nSCREENSHOTS: ${result.shots
          .map((shot) => `${shot.path.split('/').at(-1) ?? String(shot.step)} (${shot.path})`)
          .join(', ')}`;

  return contentTextContract.parse(
    `RUN: ${result.runId} (status: ${result.status}, steps: ${result.stepsRun}, duration: ${result.durationMs ?? 0}ms)${stoppedText}${screenshotsText}\n`,
  );
};

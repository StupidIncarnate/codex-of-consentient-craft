/**
 * PURPOSE: Renders a `CapacityAnswer` into a concise, token-efficient human summary
 * for terminal display — suggested instances, ceiling, spec, why sentence, host stats,
 * and profile summary. Pure transformation without side effects.
 *
 * USAGE:
 * capacityAnswerRenderTransformer({ answer: CapacityAnswerStub() });
 * // Returns 'SUGGESTED: 2 instances (ceiling: 3)\nSPEC: dungeonmaster-stack\n...'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { CapacityAnswer } from '../../contracts/capacity-answer/capacity-answer-contract';

export const capacityAnswerRenderTransformer = ({
  answer,
}: {
  answer: CapacityAnswer;
}): ContentText => {
  const spec =
    answer.profile?.spec ?? /no measured profile for ([^,]+)/u.exec(answer.why)?.[1] ?? '-';

  const profileLine = answer.profile
    ? `pool ${answer.profile.poolSize}, steady ${answer.profile.steadyMB}MB, peak ${answer.profile.peakMB}MB (from ${answer.profile.fromRuns} runs)`
    : 'no profile samples recorded';

  return contentTextContract.parse(
    [
      `SUGGESTED: ${answer.suggested} instances (ceiling: ${answer.ceiling})`,
      `SPEC: ${spec}`,
      `WHY: ${answer.why}`,
      `HOST: free ${answer.measured.freeMemMB}MB mem, ${answer.measured.cores} cores, load ${answer.measured.loadAvg1}, free disk ${answer.measured.diskFreeMB ?? '-'}MB`,
      `PROFILE: ${profileLine}`,
      '',
    ].join('\n'),
  );
};

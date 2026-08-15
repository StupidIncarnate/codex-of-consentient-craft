/**
 * PURPOSE: Splits a riftcarver carve log into display lines, preserving the log's own blank lines
 * (banner spacing between the git/node_modules/build steps) while dropping the single trailing
 * newline every log ends with — otherwise every log would render one spurious empty line past its
 * last real line. Reach for this over wardDetailToDisplayLinesTransformer when the payload is a plain
 * log string rather than a structured checks/projectResults walk: the whole log renders, not just its
 * failures, which is what proves a reload reads the persisted riftcarver-results/<id>.log rather than
 * a live stream that evaporated on refresh.
 *
 * USAGE:
 * riftcarverLogToDisplayLinesTransformer({ detail: { log: 'a\nb\n' } });
 * // Returns: ['a', 'b']
 * // Returns [] when detail does not parse or the log is empty.
 */

import { riftcarverDetailContract } from '../../contracts/riftcarver-detail/riftcarver-detail-contract';
import { riftcarverLogLineContract } from '../../contracts/riftcarver-log-line/riftcarver-log-line-contract';
import type { RiftcarverLogLine } from '../../contracts/riftcarver-log-line/riftcarver-log-line-contract';

export const riftcarverLogToDisplayLinesTransformer = ({
  detail,
}: {
  detail: unknown;
}): RiftcarverLogLine[] => {
  const parsed = riftcarverDetailContract.safeParse(detail);

  if (!parsed.success || parsed.data.log.length === 0) {
    return [];
  }

  const trimmed = parsed.data.log.endsWith('\n') ? parsed.data.log.slice(0, -1) : parsed.data.log;

  return trimmed.split('\n').map((line) => riftcarverLogLineContract.parse(line));
};

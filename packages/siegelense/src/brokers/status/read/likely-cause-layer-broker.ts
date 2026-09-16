/**
 * PURPOSE: Renders `status`'s `likelyCause` sentence — a READING of the rss recorded at the
 * instance's last beat, the absence of a recorded profile, and the machine's kernel OOM-kill count,
 * never a verdict (siegelense-tooling.md line 1193: "'rss 2980MB against a 2600MB profile peak,
 * kernel OOM kill at 20:11:04' is evidence a session can weigh. 'It ran out of memory' is a claim it
 * cannot"). This chunk records no profile, so the sentence says that plainly rather than inventing a
 * peak to compare against. `null` for a LIVE instance — nothing went wrong, so a cause would be an
 * invention (chunk-03-read-path-and-perception.md §3.D).
 *
 * USAGE:
 * likelyCauseLayerBroker({
 *   state: InstanceStateStub({ value: 'dead' }),
 *   specName: SpecNameStub({ value: 'dungeonmaster-web' }),
 *   rssAtLastBeat: MegabytesStub({ value: 2980 }),
 *   oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
 * });
 * // Returns 'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-web; kernel OOM
 * // kills since boot: 2' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';
import type { Megabytes } from '../../../contracts/megabytes/megabytes-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';

export const likelyCauseLayerBroker = ({
  state,
  specName,
  rssAtLastBeat,
  oomKillsSinceBoot,
}: {
  state: InstanceState;
  specName: SpecName;
  rssAtLastBeat: Megabytes | null;
  oomKillsSinceBoot: ReadingCount | null;
}): ContentText | null => {
  if (state === 'alive') {
    return null;
  }

  const rssPart =
    rssAtLastBeat === null
      ? 'rss unavailable at last beat'
      : `rss ${String(rssAtLastBeat)}MB at last beat; no profile recorded for spec ${specName}`;

  const oomPart =
    oomKillsSinceBoot === null
      ? 'kernel OOM events unavailable'
      : `kernel OOM kills since boot: ${String(oomKillsSinceBoot)}`;

  return contentTextContract.parse(`${rssPart}; ${oomPart}`);
};

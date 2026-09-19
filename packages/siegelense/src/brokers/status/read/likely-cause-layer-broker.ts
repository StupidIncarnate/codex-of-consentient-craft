/**
 * PURPOSE: Renders `status`'s `likelyCause` sentence — EVIDENCE, never a verdict
 * (siegelense-tooling.md line 1193: "'rss 2980MB against a 2600MB profile peak, kernel OOM kill at
 * 20:11:04' is evidence a session can weigh. 'It ran out of memory' is a claim it cannot"). A
 * recorded `shutdownReason` IS such evidence — a fact the driver wrote about itself before tearing
 * its own lane down, e.g. an idle-timeout self-reap — so it is returned AS-IS, with no RSS/OOM
 * recital appended: a deliberate shutdown has no memory story, and offering one is what turns a thin
 * answer into a misleading one. Absent that, this falls back to reading the rss recorded at the
 * instance's last beat, the absence of a recorded profile, and the machine's kernel OOM-kill count —
 * the only evidence there is for a death nothing explained. `null` for a LIVE instance either way —
 * nothing went wrong, so a cause would be an invention (chunk-03-read-path-and-perception.md §3.D).
 *
 * USAGE:
 * likelyCauseLayerBroker({
 *   state: InstanceStateStub({ value: 'dead' }),
 *   specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
 *   rssAtLastBeat: MegabytesStub({ value: 2980 }),
 *   oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
 *   shutdownReason: null,
 * });
 * // Returns 'rss 2980MB at last beat; no profile recorded for spec dungeonmaster-stack; kernel OOM
 * // kills since boot: 2' as ContentText
 *
 * likelyCauseLayerBroker({
 *   state: InstanceStateStub({ value: 'dead' }),
 *   specName: SpecNameStub({ value: 'dungeonmaster-stack' }),
 *   rssAtLastBeat: MegabytesStub({ value: 622 }),
 *   oomKillsSinceBoot: ReadingCountStub({ value: 1 }),
 *   shutdownReason: ContentTextStub({ value: 'reaped by idle timeout after 900s with no run received' }),
 * });
 * // Returns 'reaped by idle timeout after 900s with no run received' as ContentText — the RSS/OOM
 * // reading never enters the sentence
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
  shutdownReason,
}: {
  state: InstanceState;
  specName: SpecName;
  rssAtLastBeat: Megabytes | null;
  oomKillsSinceBoot: ReadingCount | null;
  shutdownReason: ContentText | null;
}): ContentText | null => {
  if (state === 'alive') {
    return null;
  }

  if (shutdownReason !== null) {
    return shutdownReason;
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

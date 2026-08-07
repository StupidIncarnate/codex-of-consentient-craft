/**
 * PURPOSE: Renders the two verification tracks' verdicts on one unit as a compact suffix a graph
 * line can carry
 *
 * USAGE:
 * signoffMarkersToTextTransformer({ flowriderSignoff, siegemasterSignoff });
 * // Returns ' [F✓ S?]' — Flowrider confirmed it, Siegemaster could not
 * signoffMarkersToTextTransformer({ flowriderSignoff: undefined, siegemasterSignoff: undefined });
 * // Returns '' — an unsigned unit carries no marker and no placeholder column
 *
 * THE EMPTY CASE IS THE LOAD-BEARING ONE. An unsigned unit renders as '' rather than as an empty
 * bracket, so every line of a quest that has recorded no sign-offs is byte-identical to the same
 * line with this suffix concatenated. Callers therefore append it unconditionally and never branch.
 *
 * THE LEADING SPACE BELONGS TO THE MARKER, not to the caller — a caller that owned the separator
 * would need a conditional at every render site to avoid a trailing space on unsigned lines, which
 * is exactly the drift this file exists to prevent.
 *
 * VERDICT ONLY. `evidence` and `question` are the whole point of a sign-off and they are
 * deliberately absent here: the graph render is what an agent gets by DEFAULT (`format: 'text'`)
 * and a whole quest has to fit inside `mcpToolResultStatics.maxVerbatimChars`. Two characters per
 * track scales with the graph; prose scales with how much the author wrote. The full text is
 * `get-quest-summary`'s job.
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { Signoff } from '../../contracts/signoff/signoff-contract';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';

const SYM = textDisplaySymbolsStatics;

export const signoffMarkersToTextTransformer = ({
  flowriderSignoff,
  siegemasterSignoff,
}: {
  flowriderSignoff: Signoff | undefined;
  siegemasterSignoff: Signoff | undefined;
}): ContentText => {
  const marks = [
    ...(flowriderSignoff === undefined
      ? []
      : [`${SYM.signoffTrackMarks.flowrider}${SYM.signoffVerdictMarks[flowriderSignoff.verdict]}`]),
    ...(siegemasterSignoff === undefined
      ? []
      : [
          `${SYM.signoffTrackMarks.siegemaster}${SYM.signoffVerdictMarks[siegemasterSignoff.verdict]}`,
        ]),
  ];

  return contentTextContract.parse(marks.length === 0 ? '' : ` [${marks.join(' ')}]`);
};

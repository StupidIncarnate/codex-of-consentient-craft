/**
 * PURPOSE: Renders every verification track's verdict on one unit as a compact suffix a graph line
 * can carry
 *
 * USAGE:
 * signoffMarkersToTextTransformer({ codeweaverSignoff, flowriderSignoff, siegemasterSignoff });
 * // Returns ' [C✓ F✓ S?]' — Codeweaver and Flowrider confirmed it, Siegemaster could not
 * signoffMarkersToTextTransformer({ codeweaverSignoff: undefined, flowriderSignoff: undefined, siegemasterSignoff: undefined });
 * // Returns '' — an unsigned unit carries no marker and no placeholder column
 * signoffMarkersToTextTransformer();
 * // Returns '' — undefined or empty input renders as an empty string
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
import type { SignoffVerdict } from '../../contracts/signoff-verdict/signoff-verdict-contract';
import type { UnitMark } from '../../contracts/unit-mark/unit-mark-contract';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';

const SYM = textDisplaySymbolsStatics;

export const signoffMarkersToTextTransformer = ({
  codeweaver,
  codeweaverSignoff,
  flowrider,
  flowriderSignoff,
  siegemaster,
  siegemasterSignoff,
}: {
  codeweaver?:
    | { verdict?: SignoffVerdict | UnitMark | undefined; mark?: UnitMark | undefined }
    | Signoff
    | UnitMark
    | SignoffVerdict
    | undefined;
  codeweaverSignoff?:
    | { verdict?: SignoffVerdict | UnitMark | undefined; mark?: UnitMark | undefined }
    | Signoff
    | UnitMark
    | SignoffVerdict
    | undefined;
  flowrider?:
    | { verdict?: SignoffVerdict | UnitMark | undefined; mark?: UnitMark | undefined }
    | Signoff
    | UnitMark
    | SignoffVerdict
    | undefined;
  flowriderSignoff?:
    | { verdict?: SignoffVerdict | UnitMark | undefined; mark?: UnitMark | undefined }
    | Signoff
    | UnitMark
    | SignoffVerdict
    | undefined;
  siegemaster?:
    | { verdict?: SignoffVerdict | UnitMark | undefined; mark?: UnitMark | undefined }
    | Signoff
    | UnitMark
    | SignoffVerdict
    | undefined;
  siegemasterSignoff?:
    | { verdict?: SignoffVerdict | UnitMark | undefined; mark?: UnitMark | undefined }
    | Signoff
    | UnitMark
    | SignoffVerdict
    | undefined;
} = {}): ContentText => {
  const codeweaverValue = codeweaverSignoff ?? codeweaver;
  const codeweaverKey =
    typeof codeweaverValue === 'string'
      ? codeweaverValue
      : (codeweaverValue?.verdict ?? codeweaverValue?.mark);
  const codeweaverGlyph =
    codeweaverKey === undefined ? undefined : SYM.signoffVerdictMarks[codeweaverKey];

  const flowriderValue = flowriderSignoff ?? flowrider;
  const flowriderKey =
    typeof flowriderValue === 'string'
      ? flowriderValue
      : (flowriderValue?.verdict ?? flowriderValue?.mark);
  const flowriderGlyph =
    flowriderKey === undefined ? undefined : SYM.signoffVerdictMarks[flowriderKey];

  const siegemasterValue = siegemasterSignoff ?? siegemaster;
  const siegemasterKey =
    typeof siegemasterValue === 'string'
      ? siegemasterValue
      : (siegemasterValue?.verdict ?? siegemasterValue?.mark);
  const siegemasterGlyph =
    siegemasterKey === undefined ? undefined : SYM.signoffVerdictMarks[siegemasterKey];

  const marks = [
    ...(codeweaverGlyph === undefined
      ? []
      : [`${SYM.signoffTrackMarks.codeweaver}${codeweaverGlyph}`]),
    ...(flowriderGlyph === undefined
      ? []
      : [`${SYM.signoffTrackMarks.flowrider}${flowriderGlyph}`]),
    ...(siegemasterGlyph === undefined
      ? []
      : [`${SYM.signoffTrackMarks.siegemaster}${siegemasterGlyph}`]),
  ];

  return contentTextContract.parse(marks.length === 0 ? '' : ` [${marks.join(' ')}]`);
};

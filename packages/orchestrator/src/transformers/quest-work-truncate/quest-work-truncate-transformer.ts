/**
 * PURPOSE: Cuts a `get-quest-work` return down until its SERIALIZED length clears the MCP verbatim
 * ceiling, dropping whole sections in `questWorkLimitsStatics.cutOrder` and recording the exact
 * number of entries each cut lost. Reach for this rather than capping any single section up front:
 * a return that already fits is handed back untouched, which is the normal case, and a cap would
 * shrink it every time for the pathological one.
 *
 * USAGE:
 * questWorkTruncateTransformer({ view });
 * // Returns the same view when it fits; otherwise the cut view plus one `truncated[]` entry per cut
 *
 * MEASURE THE SERIALIZED STRING, NOT THE OBJECT, and with the same indent the responder serializes
 * with. Over the ceiling the MCP layer writes the result to a FILE and hands the agent an error
 * stub — the session then holds a path instead of its brief, and nothing reports a failure.
 *
 * A CUT DROPS THE WHOLE SECTION, never a slice of it. A half-served list reads as a complete one:
 * nothing in the shape says where it stopped, so a planner counting commits or a walker counting
 * paths would count a number the record does not hold. An empty list plus a named dropped count
 * cannot be misread.
 *
 * CUTTING `walkPaths` RAISES `pathsTruncated`, because that flag already means exactly this and is
 * the one a walker's prompt already reads.
 *
 * `assignedUnits`, `inScopeUnits`, `piece`, `scope` AND `uncommittedPaths` ARE NOT IN THE CUT ORDER
 * and are never touched here. The first two are the signal gate's denominator; the next two are the
 * brief; `uncommittedPaths` IS a reviewer's pass, and no session runs `git status` to recover it.
 */

import { questWorkViewContract } from '../../contracts/quest-work-view/quest-work-view-contract';
import type { QuestWorkView } from '../../contracts/quest-work-view/quest-work-view-contract';
import { questWorkLimitsStatics } from '../../statics/quest-work-limits/quest-work-limits-statics';

export const questWorkTruncateTransformer = ({ view }: { view: QuestWorkView }): QuestWorkView =>
  questWorkLimitsStatics.cutOrder.reduce<QuestWorkView>((current, section) => {
    const serializedLength = JSON.stringify(
      current,
      null,
      questWorkLimitsStatics.budget.indentSpaces,
    ).length;

    if (serializedLength <= questWorkLimitsStatics.budget.maxSerializedChars) {
      return current;
    }

    const dropped = {
      flows: current.flows.length,
      committedPaths: current.committedPaths.length,
      sessionNotes: current.sessionNotes.length,
      walkPaths: current.walkPaths.length,
    }[section];

    // A section that is already empty is not a cut — recording one would name a loss nothing
    // suffered, and the next section still has to be tried against the same over-budget string.
    if (dropped === 0) {
      return current;
    }

    return questWorkViewContract.parse({
      ...current,
      ...(section === 'flows' ? { flows: [] } : {}),
      ...(section === 'committedPaths' ? { committedPaths: [] } : {}),
      ...(section === 'sessionNotes' ? { sessionNotes: [] } : {}),
      ...(section === 'walkPaths' ? { walkPaths: [], pathsTruncated: true } : {}),
      truncated: [...current.truncated, { section, dropped }],
    });
  }, view);

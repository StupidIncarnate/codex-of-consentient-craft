/**
 * PURPOSE: Puts one flow's outstanding queued comments on its tab, because only the ACTIVE flow's
 * diagram is mounted — a comment queued on a box the reader has since tabbed away from has no
 * bubble on screen to fill, and the queue bar's count names no flow. Reach for this over
 * CommentPopoverWidget when the subject is a whole flow and the mark is read-only; the popover is
 * the per-box compose affordance and owns the text.
 *
 * USAGE:
 * <FlowTabQueueMarkLayerWidget questId={commentQuestId} flowId={flow.id} />
 * // Renders nothing while that flow holds no queued comment
 */

import { IconMessageCircleFilled } from '@tabler/icons-react';

import type { FlowId, QuestId } from '@dungeonmaster/shared/contracts';

import { useCommentQueueBinding } from '../../bindings/use-comment-queue/use-comment-queue-binding';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const { colors } = emberDepthsThemeStatics;
const MARK_TEST_ID = testIdContract.parse('FLOW_TAB_QUEUE_MARK');
// An em multiple rather than a pixel count, so the glyph tracks whatever font size the tab label
// carries and cannot drift out of scale with the text it sits after. Over 1em because at the tab's
// own 11px the bubble's tail stops resolving and the mark reads as a plain dot.
const MARK_GLYPH_SIZE = '1.25em';

const MARK_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  // The label beside this is the flex item allowed to shrink and ellipsize; the mark is the point
  // of the row, so it keeps its width whatever the label does.
  flexShrink: 0,
  // Primary on every tab, active or not. The inactive tab's own text is dim, and a mark painted in
  // that dim is the one a reader scanning for unsent work does not see.
  color: colors.primary,
} as const;

export interface FlowTabQueueMarkLayerWidgetProps {
  questId: QuestId;
  flowId: FlowId;
}

export const FlowTabQueueMarkLayerWidget = ({
  questId,
  flowId,
}: FlowTabQueueMarkLayerWidgetProps): React.JSX.Element | null => {
  // Read live from the shared queue store on every render, the same way the card bubbles do, so
  // queueing, deleting, SEND and CLEAR all move the tab marks with no reload. A flag of this
  // widget's own would go stale the moment the queue changed anywhere else.
  const { entries } = useCommentQueueBinding({ questId });
  const owesSend = entries.some((entry) => entry.flowId === flowId);

  if (!owesSend) return null;

  return (
    <span data-testid={MARK_TEST_ID} style={MARK_STYLE}>
      <IconMessageCircleFilled size={MARK_GLYPH_SIZE} />
    </span>
  );
};

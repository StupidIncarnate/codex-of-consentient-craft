/**
 * PURPOSE: Renders one comment row in the flow node detail panel — the comment's text and its
 * createdAt timestamp. Layer widget for FlowNodeDetailPanelLayerWidget's comments `.map`, whose
 * callback returned a JSX tree with element children before this split.
 *
 * USAGE:
 * <FlowDetailPanelCommentRowLayerWidget comment={questComment} />
 * // Renders FLOW_DETAIL_PANEL_COMMENT_ROW with the comment's text and timestamp
 */

import type { QuestComment } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FlowDetailPanelCommentRowLayerWidgetProps {
  comment: QuestComment;
}

const { colors } = emberDepthsThemeStatics;

export const FlowDetailPanelCommentRowLayerWidget = ({
  comment,
}: FlowDetailPanelCommentRowLayerWidgetProps): React.JSX.Element => (
  <div
    data-testid="FLOW_DETAIL_PANEL_COMMENT_ROW"
    style={{
      marginBottom: 8,
      paddingBottom: 8,
      borderBottom: `1px solid ${colors.border}`,
    }}
  >
    <div
      data-testid="FLOW_DETAIL_PANEL_COMMENT_TEXT"
      // pre-wrap keeps the author's newlines; break-word is what stops a token with no
      // break opportunity (a long camelCase symbol, a base64 blob, a hash) from painting
      // past the panel's maxWidth and clipping the rest of the note. Comment text is
      // free-form user input, so it needs the same guard the node label and the assertion
      // description already carry.
      style={{ color: colors.text, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
    >
      {comment.text}
    </div>
    <div
      data-testid="FLOW_DETAIL_PANEL_COMMENT_TIME"
      style={{ color: colors['text-dim'], fontSize: 10, marginTop: 4 }}
    >
      {comment.createdAt}
    </div>
  </div>
);

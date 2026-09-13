/**
 * PURPOSE: Renders one flow's tab button — its (possibly truncated/fallback) label, active
 * styling, and its queued-comment mark — extracted from FlowsLayerWidget's tab-bar `.map` so the
 * row is a named, independently testable tree rather than an inline callback body.
 *
 * USAGE:
 * <FlowTabLayerWidget flow={flow} index={index} isActive={i === activeIndex} onSelect={() => setActiveTab(i)} />
 * // Renders a FLOW_TAB button; adds the queue mark only when commentQuestId is set
 */

import type { ArrayIndex, Flow, QuestId } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FlowTabQueueMarkLayerWidget } from './flow-tab-queue-mark-layer-widget';

const FLOW_TAB_LABEL_MAX = 28;
const TAB_GAP_PX = 5;

const { colors } = emberDepthsThemeStatics;

const TAB_STYLE_BASE = {
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '4px 10px',
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  cursor: 'pointer',
  background: 'transparent',
  color: colors['text-dim'],
  maxWidth: 220,
  overflow: 'hidden',
  // A flex row, so the queue mark sits AFTER the label rather than inside the run of text the
  // label ellipsizes — a mark in that flow is the first thing an over-long name clips off.
  display: 'inline-flex',
  alignItems: 'center',
  gap: TAB_GAP_PX,
} as const;

// Only the label may shrink, and `minWidth: 0` is what permits it to: a flex item floors at its
// content width otherwise, so a long name would push the mark past the tab's maxWidth instead.
const TAB_LABEL_STYLE = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const TAB_STYLE_ACTIVE = {
  background: colors['bg-raised'],
  color: colors.primary,
  border: `1px solid ${colors.primary}`,
} as const;

export interface FlowTabLayerWidgetProps {
  flow: Flow;
  index: ArrayIndex;
  isActive: boolean;
  onSelect: () => void;
  /** Set only when the comment compose controls are allowed; absence renders no queue mark. */
  commentQuestId?: QuestId;
}

export const FlowTabLayerWidget = ({
  flow,
  index,
  isActive,
  onSelect,
  commentQuestId,
}: FlowTabLayerWidgetProps): React.JSX.Element => {
  const name = String(flow.name);
  const label =
    name.length === 0
      ? `Flow ${index + 1}`
      : name.length > FLOW_TAB_LABEL_MAX
        ? `${name.slice(0, FLOW_TAB_LABEL_MAX - 1)}…`
        : name;

  return (
    <button
      type="button"
      data-testid="FLOW_TAB"
      data-active={isActive ? 'true' : undefined}
      title={name}
      onClick={onSelect}
      style={{ ...TAB_STYLE_BASE, ...(isActive ? TAB_STYLE_ACTIVE : {}) }}
    >
      <span data-testid="FLOW_TAB_LABEL" style={TAB_LABEL_STYLE}>
        {label}
      </span>
      {/* Gated on commentQuestId for the same reason the bubbles are: the readOnly render has no
          queue bar and no compose control, so a mark there points at work the reader cannot see
          or discharge from that surface. */}
      {commentQuestId === undefined ? null : (
        <FlowTabQueueMarkLayerWidget questId={commentQuestId} flowId={flow.id} />
      )}
    </button>
  );
};

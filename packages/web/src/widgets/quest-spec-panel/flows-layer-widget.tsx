/**
 * PURPOSE: Renders the flows section within the quest spec panel. Each flow is a tab (one tab
 * per flow) showing that flow's metadata and interactive React Flow diagram.
 *
 * USAGE:
 * <FlowsLayerWidget flows={flows} />
 * // Renders a tab per flow; the active tab shows name, entry/exit points, scope, and diagram
 */

import { useState } from 'react';

import { Box, Group, Text } from '@mantine/core';

import type {
  Flow,
  QuestComment,
  QuestContractEntry,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import type { SectionCount } from '../../contracts/section-count/section-count-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ReactFlowDiagramWidget } from '../react-flow-diagram/react-flow-diagram-widget';
import { SectionHeaderWidget } from '../section-header/section-header-widget';
import { FlowTabQueueMarkLayerWidget } from './flow-tab-queue-mark-layer-widget';

const FLOWS_LABEL = 'FLOWS' as SectionLabel;
const FIELD_MARGIN_TOP_PX = 2;
const HEADER_FONT_SIZE = 'xs' as const;
const LABEL_FONT_SIZE = 10;
const BADGE_FONT_SIZE = 9;
const BADGE_PADDING_X_PX = 4;
const BADGE_PADDING_Y_PX = 1;
const BADGE_BORDER_WIDTH_PX = 1;
const BADGE_GROUP_GAP_PX = 6;
const FLOW_TAB_LABEL_MAX = 28;
const TAB_GAP_PX = 5;

const { colors } = emberDepthsThemeStatics;

const FLOW_TYPE_BADGE_COLORS = {
  runtime: { border: colors.primary, text: colors.primary },
  operational: { border: colors['loot-rare'], text: colors['loot-rare'] },
} as const;

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

// One link each in the chain that carries a definite height from the spec panel down to the
// canvas: the section takes what the pinned user request left over, the tab panel takes what the
// section header and flow tabs left, and the diagram takes what the flow metadata left.
// `minHeight: 0` is what lets each one SHRINK — a flex item's default `min-height: auto` floors it
// at content height, so the canvas would decide the panel's height instead of the other way round.
const FILL_COLUMN_STYLE = {
  display: 'flex',
  flexDirection: 'column' as const,
  flex: 1,
  minHeight: 0,
};
const DIAGRAM_STYLE = { ...FILL_COLUMN_STYLE, marginTop: FIELD_MARGIN_TOP_PX };

export interface FlowsLayerWidgetProps {
  flows: Flow[];
  contracts?: readonly QuestContractEntry[];
  /** Set only when the comment compose controls are allowed; absence hides every comment button. */
  commentQuestId?: QuestId;
  /**
   * Every persisted comment on the quest. Passed in every status, independently of commentQuestId,
   * because the count badge and the detail panel's comment list are read affordances rather than
   * compose ones.
   */
  comments?: readonly QuestComment[];
}

export const FlowsLayerWidget = ({
  flows,
  contracts,
  commentQuestId,
  comments,
}: FlowsLayerWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState(0);

  const activeIndex = flows.length === 0 ? 0 : Math.min(activeTab, flows.length - 1);
  const activeFlow = flows[activeIndex];

  return (
    <Box data-testid="FLOWS_LAYER" style={FILL_COLUMN_STYLE}>
      <SectionHeaderWidget label={FLOWS_LABEL} count={flows.length as SectionCount} />

      {flows.length > 1 ? (
        <Group gap={4} mt={4} mb={8} data-testid="FLOW_TABS">
          {flows.map((flow, i) => {
            const name = String(flow.name);
            const label =
              name.length === 0
                ? `Flow ${i + 1}`
                : name.length > FLOW_TAB_LABEL_MAX
                  ? `${name.slice(0, FLOW_TAB_LABEL_MAX - 1)}…`
                  : name;
            const isActive = i === activeIndex;
            return (
              <button
                key={String(flow.id)}
                type="button"
                data-testid="FLOW_TAB"
                data-active={isActive ? 'true' : undefined}
                title={name}
                onClick={() => {
                  setActiveTab(i);
                }}
                style={{ ...TAB_STYLE_BASE, ...(isActive ? TAB_STYLE_ACTIVE : {}) }}
              >
                <span data-testid="FLOW_TAB_LABEL" style={TAB_LABEL_STYLE}>
                  {label}
                </span>
                {/* Gated on commentQuestId for the same reason the bubbles are: the readOnly render
                    has no queue bar and no compose control, so a mark there points at work the
                    reader cannot see or discharge from that surface. */}
                {commentQuestId === undefined ? null : (
                  <FlowTabQueueMarkLayerWidget questId={commentQuestId} flowId={flow.id} />
                )}
              </button>
            );
          })}
        </Group>
      ) : null}

      {activeFlow ? (
        <Box data-testid="FLOW_TAB_PANEL" style={FILL_COLUMN_STYLE}>
          <Group gap={BADGE_GROUP_GAP_PX} align="center" wrap="nowrap">
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              style={{ color: colors['loot-gold'] }}
              data-testid="FLOW_NAME"
            >
              {activeFlow.name}
            </Text>
            <Text
              ff="monospace"
              fw={700}
              data-testid="FLOW_TYPE_BADGE"
              style={{
                fontSize: BADGE_FONT_SIZE,
                color: FLOW_TYPE_BADGE_COLORS[activeFlow.flowType].text,
                border: `${BADGE_BORDER_WIDTH_PX}px solid ${FLOW_TYPE_BADGE_COLORS[activeFlow.flowType].border}`,
                padding: `${BADGE_PADDING_Y_PX}px ${BADGE_PADDING_X_PX}px`,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {activeFlow.flowType}
            </Text>
          </Group>
          {activeFlow.scope ? (
            <Text
              ff="monospace"
              style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
              data-testid="FLOW_SCOPE"
            >
              {activeFlow.scope}
            </Text>
          ) : null}
          <Text
            ff="monospace"
            size={HEADER_FONT_SIZE}
            style={{ color: colors['text-dim'] }}
            data-testid="FLOW_ENTRY_POINT"
          >
            entry: {activeFlow.entryPoint}
          </Text>
          <Text
            ff="monospace"
            style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
            data-testid="FLOW_EXIT_POINTS"
          >
            exit: {activeFlow.exitPoints.join(', ')}
          </Text>
          {activeFlow.nodes.length > 0 ? (
            <Box style={DIAGRAM_STYLE}>
              {/* key per flow: switching tabs mounts a fresh diagram so ELK re-lays out the new
                  flow and fit-view re-frames it (a reused instance keeps the old positions). */}
              <ReactFlowDiagramWidget
                key={String(activeFlow.id)}
                flow={activeFlow}
                {...(contracts === undefined ? {} : { contracts })}
                {...(commentQuestId === undefined ? {} : { commentQuestId })}
                {...(comments === undefined ? {} : { comments })}
              />
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};

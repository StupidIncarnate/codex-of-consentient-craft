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

import type { CssSpacing } from '../../contracts/css-spacing/css-spacing-contract';
import type { SectionCount } from '../../contracts/section-count/section-count-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { ReactFlowDiagramWidget } from '../react-flow-diagram/react-flow-diagram-widget';
import { SectionHeaderWidget } from '../section-header/section-header-widget';

const FLOWS_LABEL = 'FLOWS' as SectionLabel;
const FIELD_MARGIN_TOP_PX = 2;
const FIELD_MARGIN_TOP = FIELD_MARGIN_TOP_PX as CssSpacing;
const HEADER_FONT_SIZE = 'xs' as const;
const LABEL_FONT_SIZE = 10;
const BADGE_FONT_SIZE = 9;
const BADGE_PADDING_X_PX = 4;
const BADGE_PADDING_Y_PX = 1;
const BADGE_BORDER_WIDTH_PX = 1;
const BADGE_GROUP_GAP_PX = 6;
const FLOW_TAB_LABEL_MAX = 28;

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
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const TAB_STYLE_ACTIVE = {
  background: colors['bg-raised'],
  color: colors.primary,
  border: `1px solid ${colors.primary}`,
} as const;

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
    <Box data-testid="FLOWS_LAYER" mb="sm">
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
                {label}
              </button>
            );
          })}
        </Group>
      ) : null}

      {activeFlow ? (
        <Box data-testid="FLOW_TAB_PANEL">
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
            <Box mt={FIELD_MARGIN_TOP}>
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

/**
 * PURPOSE: Renders the flows section within the quest spec panel. In read mode each flow is a
 * tab (one tab per flow) showing that flow's metadata and interactive React Flow diagram; in
 * edit mode it falls back to the add/remove form list.
 *
 * USAGE:
 * <FlowsLayerWidget flows={flows} editing={false} onChange={handleChange} />
 * // Renders a tab per flow; the active tab shows name, entry/exit points, scope, and diagram
 */

import { useState } from 'react';

import { Box, Group, Text } from '@mantine/core';

import type { Flow, QuestContractEntry } from '@dungeonmaster/shared/contracts';

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssSpacing } from '../../contracts/css-spacing/css-spacing-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import type { SectionCount } from '../../contracts/section-count/section-count-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormInputWidget } from '../form-input/form-input-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';
import { ReactFlowDiagramWidget } from '../react-flow-diagram/react-flow-diagram-widget';
import { SectionHeaderWidget } from '../section-header/section-header-widget';

const FLOWS_LABEL = 'FLOWS' as SectionLabel;
const NAME_PLACEHOLDER = 'Name' as FormPlaceholder;
const ENTRY_POINT_PLACEHOLDER = 'Entry point' as FormPlaceholder;
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
const DIM_COLOR = colors['text-dim'] as CssColorOverride;
const GOLD_COLOR = colors['loot-gold'] as CssColorOverride;

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
  editing: boolean;
  onChange: (flows: Flow[]) => void;
}

export const FlowsLayerWidget = ({
  flows,
  contracts,
  editing,
  onChange,
}: FlowsLayerWidgetProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState(0);

  if (editing) {
    return (
      <Box data-testid="FLOWS_LAYER">
        <PlanSectionWidget
          title={FLOWS_LABEL}
          items={flows}
          editing={editing}
          onAdd={() => {
            onChange([
              ...flows,
              {
                id: crypto.randomUUID(),
                name: '',
                flowType: 'runtime',
                entryPoint: '',
                exitPoints: [],
                nodes: [],
                edges: [],
              } as unknown as Flow,
            ]);
          }}
          onRemove={(index) => {
            onChange(flows.filter((_, i) => i !== index));
          }}
          renderItem={(flow, index) => (
            <Box>
              <Group gap={BADGE_GROUP_GAP_PX} align="center" wrap="nowrap">
                <FormInputWidget
                  value={flow.name as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange(
                      flows.map((item, i) =>
                        i === index ? ({ ...item, name: value } as unknown as Flow) : item,
                      ),
                    );
                  }}
                  placeholder={NAME_PLACEHOLDER}
                  color={GOLD_COLOR}
                />
                <Text
                  ff="monospace"
                  fw={700}
                  data-testid="FLOW_TYPE_BADGE"
                  style={{
                    fontSize: BADGE_FONT_SIZE,
                    color: FLOW_TYPE_BADGE_COLORS[flow.flowType].text,
                    border: `${BADGE_BORDER_WIDTH_PX}px solid ${FLOW_TYPE_BADGE_COLORS[flow.flowType].border}`,
                    padding: `${BADGE_PADDING_Y_PX}px ${BADGE_PADDING_X_PX}px`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {flow.flowType}
                </Text>
              </Group>
              <FormInputWidget
                value={flow.entryPoint as unknown as FormInputValue}
                onChange={(value) => {
                  onChange(
                    flows.map((item, i) =>
                      i === index ? ({ ...item, entryPoint: value } as unknown as Flow) : item,
                    ),
                  );
                }}
                placeholder={ENTRY_POINT_PLACEHOLDER}
                mt={FIELD_MARGIN_TOP}
                color={DIM_COLOR}
              />
            </Box>
          )}
        />
      </Box>
    );
  }

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
              />
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};

/**
 * PURPOSE: Renders the flows section within the quest spec panel with mermaid diagram visualization
 *
 * USAGE:
 * <FlowsLayerWidget flows={flows} editing={false} onChange={handleChange} />
 * // Renders flows with name, entry/exit points, and mermaid diagram SVG
 */

import { Box, Text } from '@mantine/core';

import type { Flow } from '@dungeonmaster/shared/contracts';

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssSpacing } from '../../contracts/css-spacing/css-spacing-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import type { MermaidDefinition } from '../../contracts/mermaid-definition/mermaid-definition-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormInputWidget } from '../form-input/form-input-widget';
import { MermaidDiagramWidget } from '../mermaid-diagram/mermaid-diagram-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const FLOWS_LABEL = 'FLOWS' as SectionLabel;
const NAME_PLACEHOLDER = 'Name' as FormPlaceholder;
const ENTRY_POINT_PLACEHOLDER = 'Entry point' as FormPlaceholder;
const FIELD_MARGIN_TOP_PX = 2;
const FIELD_MARGIN_TOP = FIELD_MARGIN_TOP_PX as CssSpacing;
const HEADER_FONT_SIZE = 'xs' as const;
const LABEL_FONT_SIZE = 10;

const { colors } = emberDepthsThemeStatics;
const DIM_COLOR = colors['text-dim'] as CssColorOverride;
const GOLD_COLOR = colors['loot-gold'] as CssColorOverride;

export interface FlowsLayerWidgetProps {
  flows: Flow[];
  editing: boolean;
  onChange: (flows: Flow[]) => void;
}

export const FlowsLayerWidget = ({
  flows,
  editing,
  onChange,
}: FlowsLayerWidgetProps): React.JSX.Element => (
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
            requirementIds: [],
            entryPoint: '',
            exitPoints: [],
          } as unknown as Flow,
        ]);
      }}
      onRemove={(index) => {
        onChange(flows.filter((_, i) => i !== index));
      }}
      renderItem={(flow, index) => (
        <Box>
          {editing ? (
            <>
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
            </>
          ) : (
            <>
              <Text
                ff="monospace"
                size={HEADER_FONT_SIZE}
                fw={600}
                style={{ color: colors['loot-gold'] }}
                data-testid="FLOW_NAME"
              >
                {flow.name}
              </Text>
              <Text
                ff="monospace"
                size={HEADER_FONT_SIZE}
                style={{ color: colors['text-dim'] }}
                data-testid="FLOW_ENTRY_POINT"
              >
                entry: {flow.entryPoint}
              </Text>
              <Text
                ff="monospace"
                style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                data-testid="FLOW_EXIT_POINTS"
              >
                exit: {flow.exitPoints.join(', ')}
              </Text>
              {flow.diagram && (
                <Box mt={FIELD_MARGIN_TOP} data-testid="FLOW_DIAGRAM">
                  <MermaidDiagramWidget diagram={flow.diagram as unknown as MermaidDefinition} />
                </Box>
              )}
            </>
          )}
        </Box>
      )}
    />
  </Box>
);

/**
 * PURPOSE: Renders the read-only design decisions section within the quest spec panel
 *
 * USAGE:
 * <DesignDecisionsLayerWidget designDecisions={decisions} />
 * // Renders design decisions with title, rationale, and related node IDs tags
 */

import { Box, Text } from '@mantine/core';

import type { DesignDecision } from '@dungeonmaster/shared/contracts';

import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import type { TagItem } from '../../contracts/tag-item/tag-item-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormTagListWidget } from '../form-tag-list/form-tag-list-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const DESIGN_DECISIONS_LABEL = 'DESIGN DECISIONS' as SectionLabel;
const NODES_TAG_LABEL = 'nodes' as SectionLabel;
const HEADER_FONT_SIZE = 'xs' as const;

const { colors } = emberDepthsThemeStatics;

export interface DesignDecisionsLayerWidgetProps {
  designDecisions: DesignDecision[];
}

export const DesignDecisionsLayerWidget = ({
  designDecisions,
}: DesignDecisionsLayerWidgetProps): React.JSX.Element => (
  <Box data-testid="DESIGN_DECISIONS_LAYER">
    <PlanSectionWidget
      title={DESIGN_DECISIONS_LABEL}
      items={designDecisions}
      renderItem={(decision) => (
        <Box>
          <Text
            ff="monospace"
            size={HEADER_FONT_SIZE}
            fw={600}
            style={{ color: colors.text }}
            data-testid="DECISION_TITLE"
          >
            {decision.title}
          </Text>
          <Text
            ff="monospace"
            size={HEADER_FONT_SIZE}
            style={{ color: colors['text-dim'] }}
            data-testid="DECISION_RATIONALE"
          >
            {decision.rationale}
          </Text>
          <FormTagListWidget
            label={NODES_TAG_LABEL}
            items={decision.relatedNodeIds as unknown as TagItem[]}
          />
        </Box>
      )}
    />
  </Box>
);

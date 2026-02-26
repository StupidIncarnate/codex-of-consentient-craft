/**
 * PURPOSE: Renders the design decisions section within the quest spec panel
 *
 * USAGE:
 * <DesignDecisionsLayerWidget designDecisions={decisions} editing={false} onChange={handleChange} />
 * // Renders design decisions with title, rationale, and related requirements tags
 */

import { Box, Text } from '@mantine/core';

import type { DesignDecision } from '@dungeonmaster/shared/contracts';

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssSpacing } from '../../contracts/css-spacing/css-spacing-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import type { TagItem } from '../../contracts/tag-item/tag-item-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormInputWidget } from '../form-input/form-input-widget';
import { FormTagListWidget } from '../form-tag-list/form-tag-list-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const DESIGN_DECISIONS_LABEL = 'DESIGN DECISIONS' as SectionLabel;
const REQS_TAG_LABEL = 'reqs' as SectionLabel;
const TITLE_PLACEHOLDER = 'Title' as FormPlaceholder;
const RATIONALE_PLACEHOLDER = 'Rationale' as FormPlaceholder;
const FIELD_MARGIN_TOP_PX = 2;
const FIELD_MARGIN_TOP = FIELD_MARGIN_TOP_PX as CssSpacing;
const DIM_COLOR = emberDepthsThemeStatics.colors['text-dim'] as CssColorOverride;
const HEADER_FONT_SIZE = 'xs' as const;

const { colors } = emberDepthsThemeStatics;

export interface DesignDecisionsLayerWidgetProps {
  designDecisions: DesignDecision[];
  editing: boolean;
  onChange: (designDecisions: DesignDecision[]) => void;
}

export const DesignDecisionsLayerWidget = ({
  designDecisions,
  editing,
  onChange,
}: DesignDecisionsLayerWidgetProps): React.JSX.Element => (
  <Box data-testid="DESIGN_DECISIONS_LAYER">
    <PlanSectionWidget
      title={DESIGN_DECISIONS_LABEL}
      items={designDecisions}
      editing={editing}
      onAdd={() => {
        onChange([
          ...designDecisions,
          {
            id: crypto.randomUUID(),
            title: '',
            rationale: '',
            relatedRequirements: [],
          } as unknown as DesignDecision,
        ]);
      }}
      onRemove={(index) => {
        onChange(designDecisions.filter((_, i) => i !== index));
      }}
      renderItem={(decision, index) => (
        <Box>
          {editing ? (
            <>
              <FormInputWidget
                value={decision.title as unknown as FormInputValue}
                onChange={(value) => {
                  onChange(
                    designDecisions.map((item, i) =>
                      i === index ? ({ ...item, title: value } as unknown as DesignDecision) : item,
                    ),
                  );
                }}
                placeholder={TITLE_PLACEHOLDER}
              />
              <FormInputWidget
                value={decision.rationale as unknown as FormInputValue}
                onChange={(value) => {
                  onChange(
                    designDecisions.map((item, i) =>
                      i === index
                        ? ({ ...item, rationale: value } as unknown as DesignDecision)
                        : item,
                    ),
                  );
                }}
                placeholder={RATIONALE_PLACEHOLDER}
                mt={FIELD_MARGIN_TOP}
                color={DIM_COLOR}
              />
              <FormTagListWidget
                label={REQS_TAG_LABEL}
                items={decision.relatedRequirements as unknown as TagItem[]}
              />
            </>
          ) : (
            <>
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
                label={REQS_TAG_LABEL}
                items={decision.relatedRequirements as unknown as TagItem[]}
              />
            </>
          )}
        </Box>
      )}
    />
  </Box>
);

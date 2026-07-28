/**
 * PURPOSE: Renders the read-only tooling section within the quest spec panel
 *
 * USAGE:
 * <ContractsLayerWidget tooling={tooling} />
 * // Renders tooling with name, package, reason, observables. Contracts render inline on flow nodes, not here.
 */

import { Box, Group, Text } from '@mantine/core';

import type { ToolingRequirement } from '@dungeonmaster/shared/contracts';

import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import type { TagItem } from '../../contracts/tag-item/tag-item-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormTagListWidget } from '../form-tag-list/form-tag-list-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const TOOLING_LABEL = 'TOOLING' as SectionLabel;
const OBSERVABLES_TAG_LABEL = 'observables' as SectionLabel;
const HEADER_FONT_SIZE = 'xs' as const;

const { colors } = emberDepthsThemeStatics;

export interface ContractsLayerWidgetProps {
  tooling: ToolingRequirement[];
}

export const ContractsLayerWidget = ({ tooling }: ContractsLayerWidgetProps): React.JSX.Element => (
  <Box data-testid="CONTRACTS_LAYER">
    <PlanSectionWidget
      title={TOOLING_LABEL}
      items={tooling}
      renderItem={(tool) => (
        <Box>
          <Group gap={8}>
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              style={{ color: colors.text }}
              data-testid="TOOLING_NAME"
            >
              {tool.name}
            </Text>
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              style={{ color: colors['text-dim'] }}
              data-testid="TOOLING_PACKAGE"
            >
              {tool.packageName}
            </Text>
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              style={{ color: colors['text-dim'] }}
              data-testid="TOOLING_REASON"
            >
              {'—'} {tool.reason}
            </Text>
          </Group>
          <FormTagListWidget
            label={OBSERVABLES_TAG_LABEL}
            items={tool.requiredByObservables as unknown as TagItem[]}
          />
        </Box>
      )}
    />
  </Box>
);

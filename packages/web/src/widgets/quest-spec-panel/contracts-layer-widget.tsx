/**
 * PURPOSE: Renders the tooling section within the quest spec panel
 *
 * USAGE:
 * <ContractsLayerWidget contracts={contracts} tooling={tooling} editing={false} onChange={handleChange} />
 * // Renders tooling with name, package, reason, observables. Contracts render inline on flow nodes, not here.
 */

import { Box, Group, Text } from '@mantine/core';

import type { QuestContractEntry, ToolingRequirement } from '@dungeonmaster/shared/contracts';

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssDimension } from '../../contracts/css-dimension/css-dimension-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import type { TagItem } from '../../contracts/tag-item/tag-item-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormInputWidget } from '../form-input/form-input-widget';
import { FormTagListWidget } from '../form-tag-list/form-tag-list-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const TOOLING_LABEL = 'TOOLING' as SectionLabel;
const OBSERVABLES_TAG_LABEL = 'observables' as SectionLabel;
const NAME_PLACEHOLDER = 'Name' as FormPlaceholder;
const PACKAGE_PLACEHOLDER = 'Package' as FormPlaceholder;
const REASON_PLACEHOLDER = 'Reason' as FormPlaceholder;
const HEADER_FONT_SIZE = 'xs' as const;
const DIM_COLOR = emberDepthsThemeStatics.colors['text-dim'] as CssColorOverride;

const { colors } = emberDepthsThemeStatics;

export interface ContractsLayerOnChangePayload {
  contracts: QuestContractEntry[];
  toolingRequirements: ToolingRequirement[];
}

export interface ContractsLayerWidgetProps {
  contracts: QuestContractEntry[];
  tooling: ToolingRequirement[];
  editing: boolean;
  onChange: (payload: ContractsLayerOnChangePayload) => void;
}

export const ContractsLayerWidget = ({
  contracts,
  tooling,
  editing,
  onChange,
}: ContractsLayerWidgetProps): React.JSX.Element => (
  <Box data-testid="CONTRACTS_LAYER">
    <PlanSectionWidget
      title={TOOLING_LABEL}
      items={tooling}
      editing={editing}
      onAdd={() => {
        onChange({
          contracts,
          toolingRequirements: [
            ...tooling,
            {
              id: crypto.randomUUID(),
              name: '',
              packageName: '',
              reason: '',
              requiredByObservables: [],
            } as unknown as ToolingRequirement,
          ],
        });
      }}
      onRemove={(index) => {
        onChange({
          contracts,
          toolingRequirements: tooling.filter((_, i) => i !== index),
        });
      }}
      renderItem={(tool, index) => (
        <Box>
          {editing ? (
            <>
              <Group gap={4}>
                <FormInputWidget
                  value={tool.name as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange({
                      contracts,
                      toolingRequirements: tooling.map((item, i) =>
                        i === index
                          ? ({ ...item, name: value } as unknown as ToolingRequirement)
                          : item,
                      ),
                    });
                  }}
                  placeholder={NAME_PLACEHOLDER}
                  width={'30%' as CssDimension}
                />
                <FormInputWidget
                  value={tool.packageName as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange({
                      contracts,
                      toolingRequirements: tooling.map((item, i) =>
                        i === index
                          ? ({ ...item, packageName: value } as unknown as ToolingRequirement)
                          : item,
                      ),
                    });
                  }}
                  placeholder={PACKAGE_PLACEHOLDER}
                  color={DIM_COLOR}
                  width={'30%' as CssDimension}
                />
                <FormInputWidget
                  value={tool.reason as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange({
                      contracts,
                      toolingRequirements: tooling.map((item, i) =>
                        i === index
                          ? ({ ...item, reason: value } as unknown as ToolingRequirement)
                          : item,
                      ),
                    });
                  }}
                  placeholder={REASON_PLACEHOLDER}
                  color={DIM_COLOR}
                  width={'40%' as CssDimension}
                />
              </Group>
              <FormTagListWidget
                label={OBSERVABLES_TAG_LABEL}
                items={tool.requiredByObservables as unknown as TagItem[]}
              />
            </>
          ) : (
            <>
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
                  {'\u2014'} {tool.reason}
                </Text>
              </Group>
              <FormTagListWidget
                label={OBSERVABLES_TAG_LABEL}
                items={tool.requiredByObservables as unknown as TagItem[]}
              />
            </>
          )}
        </Box>
      )}
    />
  </Box>
);

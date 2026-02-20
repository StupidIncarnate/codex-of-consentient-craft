/**
 * PURPOSE: Renders the contracts and tooling sections within the quest spec panel
 *
 * USAGE:
 * <ContractsLayerWidget contracts={contracts} tooling={tooling} editing={false} onChange={handleChange} />
 * // Renders contracts with name, kind, status, source, properties; tooling with name, package, reason, observables
 */

import { Box, Group, Text } from '@mantine/core';

import type { QuestContractEntry, ToolingRequirement } from '@dungeonmaster/shared/contracts';

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssDimension } from '../../contracts/css-dimension/css-dimension-contract';
import type { CssSpacing } from '../../contracts/css-spacing/css-spacing-contract';
import type { DropdownOption } from '../../contracts/dropdown-option/dropdown-option-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import type { TagItem } from '../../contracts/tag-item/tag-item-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormDropdownWidget } from '../form-dropdown/form-dropdown-widget';
import { FormInputWidget } from '../form-input/form-input-widget';
import { FormTagListWidget } from '../form-tag-list/form-tag-list-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const CONTRACTS_LABEL = 'CONTRACTS' as SectionLabel;
const TOOLING_LABEL = 'TOOLING' as SectionLabel;
const OBSERVABLES_TAG_LABEL = 'observables' as SectionLabel;
const NAME_PLACEHOLDER = 'Name' as FormPlaceholder;
const SOURCE_PLACEHOLDER = 'Source path' as FormPlaceholder;
const PACKAGE_PLACEHOLDER = 'Package' as FormPlaceholder;
const REASON_PLACEHOLDER = 'Reason' as FormPlaceholder;
const PROP_NAME_PLACEHOLDER = 'prop name' as FormPlaceholder;
const PROP_TYPE_PLACEHOLDER = 'type' as FormPlaceholder;
const PROP_VALUE_PLACEHOLDER = 'value' as FormPlaceholder;
const FIELD_MARGIN_TOP_PX = 2;
const FIELD_MARGIN_TOP = FIELD_MARGIN_TOP_PX as CssSpacing;
const DIM_COLOR = emberDepthsThemeStatics.colors['text-dim'] as CssColorOverride;
const LOOT_RARE_COLOR = emberDepthsThemeStatics.colors['loot-rare'] as CssColorOverride;
const HEADER_FONT_SIZE = 'xs' as const;
const PROPERTY_FONT_SIZE = 10;

const { colors } = emberDepthsThemeStatics;

const CONTRACT_KINDS: DropdownOption[] = [
  'data' as DropdownOption,
  'endpoint' as DropdownOption,
  'event' as DropdownOption,
];

const CONTRACT_STATUSES: DropdownOption[] = [
  'new' as DropdownOption,
  'existing' as DropdownOption,
  'modified' as DropdownOption,
];

const STATUS_COLORS = {
  new: colors.success,
  existing: colors['text-dim'],
  modified: colors.warning,
} as const;

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
      title={CONTRACTS_LABEL}
      items={contracts}
      editing={editing}
      onAdd={() => {
        onChange({
          contracts: [
            ...contracts,
            {
              id: crypto.randomUUID(),
              name: '',
              kind: 'data',
              status: 'new',
              properties: [],
            } as unknown as QuestContractEntry,
          ],
          toolingRequirements: tooling,
        });
      }}
      onRemove={(index) => {
        onChange({
          contracts: contracts.filter((_, i) => i !== index),
          toolingRequirements: tooling,
        });
      }}
      renderItem={(contract, index) => (
        <Box>
          {editing ? (
            <>
              <Group gap={4} mb={FIELD_MARGIN_TOP}>
                <FormInputWidget
                  value={contract.name as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange({
                      contracts: contracts.map((item, i) =>
                        i === index
                          ? ({ ...item, name: value } as unknown as QuestContractEntry)
                          : item,
                      ),
                      toolingRequirements: tooling,
                    });
                  }}
                  placeholder={NAME_PLACEHOLDER}
                  color={LOOT_RARE_COLOR}
                  width={'40%' as CssDimension}
                />
                <FormDropdownWidget
                  value={contract.kind as DropdownOption}
                  options={CONTRACT_KINDS}
                  onChange={(value) => {
                    onChange({
                      contracts: contracts.map((item, i) =>
                        i === index
                          ? ({ ...item, kind: value } as unknown as QuestContractEntry)
                          : item,
                      ),
                      toolingRequirements: tooling,
                    });
                  }}
                  color={DIM_COLOR}
                />
                <FormDropdownWidget
                  value={contract.status as DropdownOption}
                  options={CONTRACT_STATUSES}
                  onChange={(value) => {
                    onChange({
                      contracts: contracts.map((item, i) =>
                        i === index
                          ? ({ ...item, status: value } as unknown as QuestContractEntry)
                          : item,
                      ),
                      toolingRequirements: tooling,
                    });
                  }}
                />
              </Group>
              <FormInputWidget
                value={(contract.source ?? '') as unknown as FormInputValue}
                onChange={(value) => {
                  onChange({
                    contracts: contracts.map((item, i) =>
                      i === index
                        ? ({ ...item, source: value } as unknown as QuestContractEntry)
                        : item,
                    ),
                    toolingRequirements: tooling,
                  });
                }}
                placeholder={SOURCE_PLACEHOLDER}
                color={DIM_COLOR}
              />
              {contract.properties.map((property, propertyIndex) => (
                <Group
                  key={`${property.name}-${String(propertyIndex)}`}
                  gap={4}
                  mt={FIELD_MARGIN_TOP}
                >
                  <FormInputWidget
                    value={property.name as unknown as FormInputValue}
                    onChange={(value) => {
                      onChange({
                        contracts: contracts.map((item, i) =>
                          i === index
                            ? ({
                                ...item,
                                properties: item.properties.map((p, pi) =>
                                  pi === propertyIndex ? { ...p, name: value } : p,
                                ),
                              } as unknown as QuestContractEntry)
                            : item,
                        ),
                        toolingRequirements: tooling,
                      });
                    }}
                    placeholder={PROP_NAME_PLACEHOLDER}
                    color={DIM_COLOR}
                    width={'30%' as CssDimension}
                  />
                  {property.type !== undefined && (
                    <FormInputWidget
                      value={property.type as unknown as FormInputValue}
                      onChange={(value) => {
                        onChange({
                          contracts: contracts.map((item, i) =>
                            i === index
                              ? ({
                                  ...item,
                                  properties: item.properties.map((p, pi) =>
                                    pi === propertyIndex ? { ...p, type: value } : p,
                                  ),
                                } as unknown as QuestContractEntry)
                              : item,
                          ),
                          toolingRequirements: tooling,
                        });
                      }}
                      placeholder={PROP_TYPE_PLACEHOLDER}
                      width={'30%' as CssDimension}
                    />
                  )}
                  {property.value !== undefined && (
                    <FormInputWidget
                      value={property.value as unknown as FormInputValue}
                      onChange={(value) => {
                        onChange({
                          contracts: contracts.map((item, i) =>
                            i === index
                              ? ({
                                  ...item,
                                  properties: item.properties.map((p, pi) =>
                                    pi === propertyIndex ? { ...p, value } : p,
                                  ),
                                } as unknown as QuestContractEntry)
                              : item,
                          ),
                          toolingRequirements: tooling,
                        });
                      }}
                      placeholder={PROP_VALUE_PLACEHOLDER}
                      width={'30%' as CssDimension}
                    />
                  )}
                </Group>
              ))}
            </>
          ) : (
            <>
              <Group gap={8}>
                <Text
                  ff="monospace"
                  size={HEADER_FONT_SIZE}
                  fw={600}
                  style={{ color: colors['loot-rare'] }}
                  data-testid="CONTRACT_NAME"
                >
                  {contract.name}
                </Text>
                <Text
                  ff="monospace"
                  size={HEADER_FONT_SIZE}
                  style={{ color: colors['text-dim'] }}
                  data-testid="CONTRACT_KIND"
                >
                  {contract.kind}
                </Text>
                <Text
                  ff="monospace"
                  size={HEADER_FONT_SIZE}
                  style={{
                    color:
                      (Reflect.get(STATUS_COLORS, contract.status) as
                        | (typeof colors)['text-dim']
                        | undefined) ?? colors['text-dim'],
                  }}
                  data-testid="CONTRACT_STATUS"
                >
                  {contract.status}
                </Text>
              </Group>
              {contract.source !== undefined && (
                <Text
                  ff="monospace"
                  style={{ fontSize: PROPERTY_FONT_SIZE, color: colors['text-dim'] }}
                  data-testid="CONTRACT_SOURCE"
                >
                  {contract.source}
                </Text>
              )}
              {contract.properties.map((property, propertyIndex) => (
                <Text
                  key={`${property.name}-${String(propertyIndex)}`}
                  ff="monospace"
                  style={{ fontSize: PROPERTY_FONT_SIZE, color: colors['text-dim'] }}
                  data-testid="CONTRACT_PROPERTY"
                >
                  {property.name}:{' '}
                  <span style={{ color: colors.text }}>{property.type ?? property.value}</span>
                  {property.description !== undefined && ` \u2014 ${property.description}`}
                </Text>
              ))}
            </>
          )}
        </Box>
      )}
    />

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

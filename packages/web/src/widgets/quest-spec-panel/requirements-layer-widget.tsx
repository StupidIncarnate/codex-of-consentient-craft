/**
 * PURPOSE: Renders the requirements section within the quest spec panel
 *
 * USAGE:
 * <RequirementsLayerWidget requirements={requirements} editing={false} onChange={handleChange} />
 * // Renders requirements with name, description, scope, and status
 */

import { Box, Group, Text } from '@mantine/core';

import type { Requirement } from '@dungeonmaster/shared/contracts';

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { CssSpacing } from '../../contracts/css-spacing/css-spacing-contract';
import type { DropdownOption } from '../../contracts/dropdown-option/dropdown-option-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import type { SectionLabel } from '../../contracts/section-label/section-label-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormDropdownWidget } from '../form-dropdown/form-dropdown-widget';
import { FormInputWidget } from '../form-input/form-input-widget';
import { PlanSectionWidget } from '../plan-section/plan-section-widget';

const REQUIREMENTS_LABEL = 'REQUIREMENTS' as SectionLabel;
const NAME_PLACEHOLDER = 'Name' as FormPlaceholder;
const DESCRIPTION_PLACEHOLDER = 'Description' as FormPlaceholder;
const SCOPE_PLACEHOLDER = 'Scope' as FormPlaceholder;
const FIELD_MARGIN_TOP_PX = 2;
const FIELD_MARGIN_TOP = FIELD_MARGIN_TOP_PX as CssSpacing;
const DIM_COLOR = emberDepthsThemeStatics.colors['text-dim'] as CssColorOverride;
const HEADER_FONT_SIZE = 'xs' as const;

const { colors } = emberDepthsThemeStatics;

const REQUIREMENT_STATUSES: DropdownOption[] = [
  'proposed' as DropdownOption,
  'approved' as DropdownOption,
  'deferred' as DropdownOption,
];

const STATUS_COLORS = {
  proposed: colors.warning,
  approved: colors.success,
  deferred: colors['text-dim'],
} as const;

export interface RequirementsLayerOnChangePayload {
  requirements: Requirement[];
}

export interface RequirementsLayerWidgetProps {
  requirements: Requirement[];
  editing: boolean;
  onChange: (payload: RequirementsLayerOnChangePayload) => void;
}

export const RequirementsLayerWidget = ({
  requirements,
  editing,
  onChange,
}: RequirementsLayerWidgetProps): React.JSX.Element => (
  <Box data-testid="REQUIREMENTS_LAYER">
    <PlanSectionWidget
      title={REQUIREMENTS_LABEL}
      items={requirements}
      editing={editing}
      onAdd={() => {
        onChange({
          requirements: [
            ...requirements,
            {
              id: crypto.randomUUID(),
              name: '',
              description: '',
              scope: '',
            } as unknown as Requirement,
          ],
        });
      }}
      onRemove={(index) => {
        onChange({
          requirements: requirements.filter((_, i) => i !== index),
        });
      }}
      renderItem={(requirement, index) => (
        <Group gap={8} wrap="nowrap" align="flex-start">
          <Box style={{ flex: 1 }}>
            {editing ? (
              <>
                <FormInputWidget
                  value={requirement.name as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange({
                      requirements: requirements.map((item, i) =>
                        i === index ? ({ ...item, name: value } as unknown as Requirement) : item,
                      ),
                    });
                  }}
                  placeholder={NAME_PLACEHOLDER}
                />
                <FormInputWidget
                  value={requirement.description as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange({
                      requirements: requirements.map((item, i) =>
                        i === index
                          ? ({ ...item, description: value } as unknown as Requirement)
                          : item,
                      ),
                    });
                  }}
                  placeholder={DESCRIPTION_PLACEHOLDER}
                  mt={FIELD_MARGIN_TOP}
                  color={DIM_COLOR}
                />
                <FormInputWidget
                  value={requirement.scope as unknown as FormInputValue}
                  onChange={(value) => {
                    onChange({
                      requirements: requirements.map((item, i) =>
                        i === index ? ({ ...item, scope: value } as unknown as Requirement) : item,
                      ),
                    });
                  }}
                  placeholder={SCOPE_PLACEHOLDER}
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
                  style={{ color: colors.text }}
                  data-testid="REQUIREMENT_NAME"
                >
                  {requirement.name}
                </Text>
                <Text
                  ff="monospace"
                  size={HEADER_FONT_SIZE}
                  style={{ color: colors['text-dim'] }}
                  data-testid="REQUIREMENT_DESCRIPTION"
                >
                  {requirement.description}
                </Text>
                <Text
                  ff="monospace"
                  size={HEADER_FONT_SIZE}
                  style={{ color: colors['text-dim'] }}
                  data-testid="REQUIREMENT_SCOPE"
                >
                  scope: {requirement.scope}
                </Text>
              </>
            )}
          </Box>
          {editing ? (
            <FormDropdownWidget
              value={(requirement.status ?? 'proposed') as DropdownOption}
              options={REQUIREMENT_STATUSES}
              onChange={(value) => {
                onChange({
                  requirements: requirements.map((item, i) =>
                    i === index ? ({ ...item, status: value } as unknown as Requirement) : item,
                  ),
                });
              }}
            />
          ) : (
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              style={{
                color:
                  (Reflect.get(STATUS_COLORS, requirement.status ?? 'proposed') as
                    | (typeof colors)['text-dim']
                    | undefined) ?? colors['text-dim'],
                flexShrink: 0,
              }}
              data-testid="REQUIREMENT_STATUS"
            >
              {(requirement.status ?? 'proposed').toUpperCase()}
            </Text>
          )}
        </Group>
      )}
    />
  </Box>
);

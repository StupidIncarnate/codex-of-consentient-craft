/**
 * PURPOSE: Renders the flows, contexts, and observables sections within the quest spec panel
 *
 * USAGE:
 * <ObservablesLayerWidget flows={flows} contexts={contexts} observables={observables} editing={false} onChange={handleChange} />
 * // Renders flows with name/entry/exit, contexts with locator, observables with trigger/outcomes
 */

import { Box, Group, Text } from '@mantine/core';

import type { Context, Flow, Observable } from '@dungeonmaster/shared/contracts';

import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
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

const FLOWS_LABEL = 'FLOWS' as SectionLabel;
const CONTEXTS_LABEL = 'CONTEXTS' as SectionLabel;
const OBSERVABLES_LABEL = 'OBSERVABLES' as SectionLabel;
const DEPENDS_TAG_LABEL = 'depends' as SectionLabel;

const NAME_PLACEHOLDER = 'Name' as FormPlaceholder;
const DESCRIPTION_PLACEHOLDER = 'Description' as FormPlaceholder;
const ENTRY_POINT_PLACEHOLDER = 'Entry point' as FormPlaceholder;
const PAGE_PLACEHOLDER = 'page' as FormPlaceholder;
const SECTION_PLACEHOLDER = 'section' as FormPlaceholder;
const TRIGGER_PLACEHOLDER = 'WHEN trigger...' as FormPlaceholder;
const OUTCOME_PLACEHOLDER = 'THEN outcome...' as FormPlaceholder;
const VERIFICATION_NOTES_PLACEHOLDER = 'Verification notes' as FormPlaceholder;

const FIELD_MARGIN_TOP_PX = 2;
const FIELD_MARGIN_TOP = FIELD_MARGIN_TOP_PX as CssSpacing;
const HEADER_FONT_SIZE = 'xs' as const;
const LABEL_FONT_SIZE = 10;

const { colors } = emberDepthsThemeStatics;
const DIM_COLOR = colors['text-dim'] as CssColorOverride;
const GOLD_COLOR = colors['loot-gold'] as CssColorOverride;
const SUCCESS_COLOR = colors.success as CssColorOverride;

const VERIFICATION_STATUSES: DropdownOption[] = [
  'pending' as DropdownOption,
  'verified' as DropdownOption,
  'failed' as DropdownOption,
];

const OUTCOME_TYPES: DropdownOption[] = [
  'api-call' as DropdownOption,
  'file-exists' as DropdownOption,
  'environment' as DropdownOption,
  'log-output' as DropdownOption,
  'process-state' as DropdownOption,
  'performance' as DropdownOption,
  'ui-state' as DropdownOption,
  'cache-state' as DropdownOption,
  'db-query' as DropdownOption,
  'queue-message' as DropdownOption,
  'external-api' as DropdownOption,
  'custom' as DropdownOption,
];

const STATUS_COLORS = {
  pending: colors.warning,
  verified: colors.success,
  failed: colors.danger,
} as const;

export interface ObservablesLayerWidgetProps {
  flows: Flow[];
  contexts: Context[];
  observables: Observable[];
  editing: boolean;
  onChange: () => void;
}

export const ObservablesLayerWidget = ({
  flows,
  contexts,
  observables,
  editing,
  onChange,
}: ObservablesLayerWidgetProps): React.JSX.Element => (
  <Box data-testid="OBSERVABLES_LAYER">
    <PlanSectionWidget
      title={FLOWS_LABEL}
      items={flows}
      editing={editing}
      onAdd={onChange}
      onRemove={() => {
        onChange();
      }}
      renderItem={(flow) => (
        <Box>
          {editing ? (
            <>
              <FormInputWidget
                value={flow.name as unknown as FormInputValue}
                onChange={() => {
                  onChange();
                }}
                placeholder={NAME_PLACEHOLDER}
                color={GOLD_COLOR}
              />
              <FormInputWidget
                value={flow.entryPoint as unknown as FormInputValue}
                onChange={() => {
                  onChange();
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
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                  data-testid="FLOW_DIAGRAM_INDICATOR"
                >
                  [diagram]
                </Text>
              )}
            </>
          )}
        </Box>
      )}
    />

    <PlanSectionWidget
      title={CONTEXTS_LABEL}
      items={contexts}
      editing={editing}
      onAdd={onChange}
      onRemove={() => {
        onChange();
      }}
      renderItem={(ctx) => (
        <Box>
          {editing ? (
            <>
              <FormInputWidget
                value={ctx.name as unknown as FormInputValue}
                onChange={() => {
                  onChange();
                }}
                placeholder={NAME_PLACEHOLDER}
                color={GOLD_COLOR}
              />
              <FormInputWidget
                value={ctx.description as unknown as FormInputValue}
                onChange={() => {
                  onChange();
                }}
                placeholder={DESCRIPTION_PLACEHOLDER}
                mt={FIELD_MARGIN_TOP}
                color={DIM_COLOR}
              />
              <Group gap={4} mt={FIELD_MARGIN_TOP_PX}>
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                >
                  locator:
                </Text>
                <FormInputWidget
                  value={(ctx.locator.page ?? '') as unknown as FormInputValue}
                  onChange={() => {
                    onChange();
                  }}
                  placeholder={PAGE_PLACEHOLDER}
                  color={DIM_COLOR}
                />
                <FormInputWidget
                  value={(ctx.locator.section ?? '') as unknown as FormInputValue}
                  onChange={() => {
                    onChange();
                  }}
                  placeholder={SECTION_PLACEHOLDER}
                  color={DIM_COLOR}
                />
              </Group>
            </>
          ) : (
            <>
              <Text
                ff="monospace"
                size={HEADER_FONT_SIZE}
                fw={600}
                style={{ color: colors['loot-gold'] }}
                data-testid="CONTEXT_NAME"
              >
                {ctx.name}
              </Text>
              <Text
                ff="monospace"
                size={HEADER_FONT_SIZE}
                style={{ color: colors['text-dim'] }}
                data-testid="CONTEXT_DESCRIPTION"
              >
                {ctx.description}
              </Text>
              {(ctx.locator.page ?? ctx.locator.section) && (
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                  data-testid="CONTEXT_LOCATOR"
                >
                  locator: {ctx.locator.page}
                  {ctx.locator.page && ctx.locator.section ? ' \u2192 ' : ''}
                  {ctx.locator.section}
                </Text>
              )}
            </>
          )}
        </Box>
      )}
    />

    <PlanSectionWidget
      title={OBSERVABLES_LABEL}
      items={observables}
      editing={editing}
      onAdd={onChange}
      onRemove={() => {
        onChange();
      }}
      renderItem={(obs) => (
        <Box>
          {editing ? (
            <>
              <Group gap={4} mb={FIELD_MARGIN_TOP_PX}>
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                >
                  context:
                </Text>
                <FormDropdownWidget
                  value={obs.contextId as unknown as DropdownOption}
                  options={contexts.map((c) => c.id as unknown as DropdownOption)}
                  onChange={() => {
                    onChange();
                  }}
                  color={GOLD_COLOR}
                />
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                >
                  req:
                </Text>
                <FormDropdownWidget
                  value={(obs.requirementId ?? '') as unknown as DropdownOption}
                  options={['' as DropdownOption]}
                  onChange={() => {
                    onChange();
                  }}
                  color={colors['loot-rare'] as CssColorOverride}
                />
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                >
                  verify:
                </Text>
                <FormDropdownWidget
                  value={(obs.verificationStatus ?? 'pending') as unknown as DropdownOption}
                  options={VERIFICATION_STATUSES}
                  onChange={() => {
                    onChange();
                  }}
                />
              </Group>
              <FormInputWidget
                value={obs.trigger as unknown as FormInputValue}
                onChange={() => {
                  onChange();
                }}
                placeholder={TRIGGER_PLACEHOLDER}
              />
              {obs.outcomes.map((oc, oi) => (
                <Group
                  key={String(oi)}
                  gap={4}
                  mt={FIELD_MARGIN_TOP_PX}
                  wrap="nowrap"
                  align="flex-start"
                >
                  <FormDropdownWidget
                    value={oc.type as unknown as DropdownOption}
                    options={OUTCOME_TYPES}
                    onChange={() => {
                      onChange();
                    }}
                    color={DIM_COLOR}
                  />
                  <Box style={{ flex: 1 }}>
                    <FormInputWidget
                      value={oc.description as unknown as FormInputValue}
                      onChange={() => {
                        onChange();
                      }}
                      placeholder={OUTCOME_PLACEHOLDER}
                      color={SUCCESS_COLOR}
                    />
                  </Box>
                </Group>
              ))}
              <FormInputWidget
                value={(obs.verificationNotes ?? '') as unknown as FormInputValue}
                onChange={() => {
                  onChange();
                }}
                placeholder={VERIFICATION_NOTES_PLACEHOLDER}
                mt={FIELD_MARGIN_TOP}
                color={DIM_COLOR}
              />
              <FormTagListWidget
                label={DEPENDS_TAG_LABEL}
                items={obs.dependsOn as unknown as TagItem[]}
              />
            </>
          ) : (
            <>
              <Group gap={8} mb={FIELD_MARGIN_TOP_PX}>
                <Text
                  ff="monospace"
                  style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                  data-testid="OBSERVABLE_CONTEXT_REF"
                >
                  ctx: <span style={{ color: colors['loot-gold'] }}>{obs.contextId}</span>
                </Text>
                {obs.requirementId && (
                  <Text
                    ff="monospace"
                    style={{ fontSize: LABEL_FONT_SIZE, color: colors['text-dim'] }}
                    data-testid="OBSERVABLE_REQ_REF"
                  >
                    req: <span style={{ color: colors['loot-rare'] }}>{obs.requirementId}</span>
                  </Text>
                )}
                <Text
                  ff="monospace"
                  style={{
                    fontSize: LABEL_FONT_SIZE,
                    color:
                      (Reflect.get(STATUS_COLORS, obs.verificationStatus ?? 'pending') as
                        | (typeof colors)['text-dim']
                        | undefined) ?? colors['text-dim'],
                  }}
                  data-testid="OBSERVABLE_VERIFICATION_STATUS"
                >
                  {obs.verificationStatus ?? 'pending'}
                </Text>
              </Group>
              <Text
                ff="monospace"
                size={HEADER_FONT_SIZE}
                style={{ color: colors['text-dim'] }}
                data-testid="OBSERVABLE_TRIGGER"
              >
                WHEN <span style={{ color: colors.text }}>{obs.trigger}</span>
              </Text>
              {obs.outcomes.map((oc, oi) => (
                <Text
                  key={String(oi)}
                  ff="monospace"
                  size={HEADER_FONT_SIZE}
                  style={{ color: colors['text-dim'] }}
                  data-testid="OBSERVABLE_OUTCOME"
                >
                  THEN <span style={{ color: colors.success }}>{oc.description}</span>{' '}
                  <span style={{ fontSize: LABEL_FONT_SIZE }}>({oc.type})</span>
                </Text>
              ))}
              {obs.dependsOn.length > 0 && (
                <FormTagListWidget
                  label={DEPENDS_TAG_LABEL}
                  items={obs.dependsOn as unknown as TagItem[]}
                />
              )}
            </>
          )}
        </Box>
      )}
    />
  </Box>
);

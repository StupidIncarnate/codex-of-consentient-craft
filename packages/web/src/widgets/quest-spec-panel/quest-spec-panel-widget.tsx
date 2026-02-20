/**
 * PURPOSE: Renders the quest spec panel with title bar, scrollable content area, and action bar for editing/approving quest specs
 *
 * USAGE:
 * <QuestSpecPanelWidget quest={quest} onModify={handleModify} onRefresh={handleRefresh} />
 * // Renders panel with requirements, observables, and contracts layers with edit/approve controls
 */

import { useState } from 'react';

import { Box, Group, Stack, Text } from '@mantine/core';

import type { Quest } from '@dungeonmaster/shared/contracts';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import type { CssColorOverride } from '../../contracts/css-color-override/css-color-override-contract';
import type { FormInputValue } from '../../contracts/form-input-value/form-input-value-contract';
import type { FormPlaceholder } from '../../contracts/form-placeholder/form-placeholder-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { FormInputWidget } from '../form-input/form-input-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { ContractsLayerWidget } from './contracts-layer-widget';
import { ObservablesLayerWidget } from './observables-layer-widget';
import { RequirementsLayerWidget } from './requirements-layer-widget';

const APPROVE_LABEL = 'APPROVE' as ButtonLabel;
const MODIFY_LABEL = 'MODIFY' as ButtonLabel;
const SUBMIT_LABEL = 'SUBMIT' as ButtonLabel;
const CANCEL_LABEL = 'CANCEL' as ButtonLabel;
const GHOST_VARIANT = 'ghost' as ButtonVariant;
const TITLE_PLACEHOLDER = 'Quest title' as FormPlaceholder;
const TITLE_COLOR = emberDepthsThemeStatics.colors['loot-gold'] as CssColorOverride;
const SCROLLABLE_STYLE = { flex: 1, overflowY: 'auto' as const, padding: 16 };
const TITLE_BAR_STYLE_BASE = { padding: '8px 16px' };
const ACTION_BAR_STYLE_BASE = { padding: 12, flexShrink: 0 };
const HEADER_FONT_SIZE = 'xs' as const;

export interface QuestSpecPanelWidgetProps {
  quest: Quest;
  onModify: (params: { modifications: Record<string, unknown> }) => void;
  onRefresh: () => void;
}

export const QuestSpecPanelWidget = ({
  quest,
  onModify,
  onRefresh,
}: QuestSpecPanelWidgetProps): React.JSX.Element => {
  const [editing, setEditing] = useState(false);
  const { colors } = emberDepthsThemeStatics;

  return (
    <Stack gap={0} style={{ height: '100%' }} data-testid="QUEST_SPEC_PANEL">
      <Box style={{ ...TITLE_BAR_STYLE_BASE, borderBottom: `1px solid ${colors.border}` }}>
        {editing ? (
          <FormInputWidget
            value={quest.title as unknown as FormInputValue}
            onChange={() => undefined}
            placeholder={TITLE_PLACEHOLDER}
            color={TITLE_COLOR}
          />
        ) : (
          <Text
            ff="monospace"
            size={HEADER_FONT_SIZE}
            fw={600}
            style={{ color: colors['loot-gold'] }}
            data-testid="QUEST_TITLE"
          >
            {quest.title}
          </Text>
        )}
      </Box>
      <Box style={SCROLLABLE_STYLE}>
        <Text
          ff="monospace"
          size={HEADER_FONT_SIZE}
          fw={600}
          mb="md"
          style={{ color: colors.primary }}
          data-testid="PANEL_HEADER"
        >
          {editing ? 'EDITING SPEC' : 'OBSERVABLES APPROVAL'}
        </Text>

        <RequirementsLayerWidget
          requirements={quest.requirements}
          designDecisions={quest.designDecisions}
          editing={editing}
          onChange={() => undefined}
        />

        <ObservablesLayerWidget
          flows={quest.flows}
          contexts={quest.contexts}
          observables={quest.observables}
          editing={editing}
          onChange={() => undefined}
        />

        <ContractsLayerWidget
          contracts={quest.contracts}
          tooling={quest.toolingRequirements}
          editing={editing}
          onChange={() => undefined}
        />
      </Box>
      <Box
        style={{
          ...ACTION_BAR_STYLE_BASE,
          borderTop: `1px solid ${colors.border}`,
        }}
        data-testid="ACTION_BAR"
      >
        <Group gap="xs">
          {editing ? (
            <>
              <PixelBtnWidget
                label={SUBMIT_LABEL}
                onClick={() => {
                  setEditing(false);
                  onModify({ modifications: {} });
                }}
              />
              <PixelBtnWidget
                label={CANCEL_LABEL}
                variant={GHOST_VARIANT}
                onClick={() => {
                  setEditing(false);
                }}
              />
            </>
          ) : (
            <>
              <PixelBtnWidget
                label={APPROVE_LABEL}
                onClick={() => {
                  onRefresh();
                }}
              />
              <PixelBtnWidget
                label={MODIFY_LABEL}
                variant={GHOST_VARIANT}
                onClick={() => {
                  setEditing(true);
                }}
              />
            </>
          )}
        </Group>
      </Box>
    </Stack>
  );
};

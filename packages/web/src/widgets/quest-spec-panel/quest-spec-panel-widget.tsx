/**
 * PURPOSE: Renders the quest spec panel with title bar, scrollable content area, and action bar for editing/approving quest specs
 *
 * USAGE:
 * <QuestSpecPanelWidget quest={quest} onModify={handleModify} onRefresh={handleRefresh} />
 * // Renders panel with requirements, observables, and contracts layers with edit/approve controls
 */

import { useEffect, useState } from 'react';

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
  externalUpdatePending?: boolean;
  onDismissUpdate?: () => void;
}

export const QuestSpecPanelWidget = ({
  quest,
  onModify,
  onRefresh,
  externalUpdatePending,
  onDismissUpdate,
}: QuestSpecPanelWidgetProps): React.JSX.Element => {
  const [editing, setEditing] = useState(false);
  const [draftModifications, setDraftModifications] = useState<Partial<Quest>>({});
  const { colors } = emberDepthsThemeStatics;

  useEffect(() => {
    if (externalUpdatePending && !editing && onDismissUpdate) {
      onDismissUpdate();
    }
  }, [externalUpdatePending, editing, onDismissUpdate]);

  const draftTitle = draftModifications.title ?? quest.title;
  const draftRequirements = draftModifications.requirements ?? quest.requirements;
  const draftDesignDecisions = draftModifications.designDecisions ?? quest.designDecisions;
  const draftFlows = draftModifications.flows ?? quest.flows;
  const draftContexts = draftModifications.contexts ?? quest.contexts;
  const draftObservables = draftModifications.observables ?? quest.observables;
  const draftContracts = draftModifications.contracts ?? quest.contracts;
  const draftTooling = draftModifications.toolingRequirements ?? quest.toolingRequirements;

  return (
    <Stack gap={0} style={{ height: '100%' }} data-testid="QUEST_SPEC_PANEL">
      <Box style={{ ...TITLE_BAR_STYLE_BASE, borderBottom: `1px solid ${colors.border}` }}>
        {editing ? (
          <FormInputWidget
            value={draftTitle as unknown as FormInputValue}
            onChange={(value) => {
              setDraftModifications((prev) => ({
                ...prev,
                title: value as unknown as Quest['title'],
              }));
            }}
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
        {editing && externalUpdatePending ? (
          <Box
            data-testid="EXTERNAL_UPDATE_BANNER"
            style={{
              border: `1px solid ${colors.border}`,
              padding: 8,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text ff="monospace" size="xs" style={{ color: colors['text-dim'], flex: 1 }}>
              Quest updated externally
            </Text>
            <PixelBtnWidget
              label={'RELOAD' as ButtonLabel}
              onClick={() => {
                setDraftModifications({});
                setEditing(false);
                if (onDismissUpdate) {
                  onDismissUpdate();
                }
              }}
            />
            <PixelBtnWidget
              label={'KEEP EDITING' as ButtonLabel}
              variant={GHOST_VARIANT}
              onClick={() => {
                if (onDismissUpdate) {
                  onDismissUpdate();
                }
              }}
            />
          </Box>
        ) : null}
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
          requirements={draftRequirements}
          designDecisions={draftDesignDecisions}
          editing={editing}
          onChange={(payload) => {
            setDraftModifications((prev) => ({
              ...prev,
              requirements: payload.requirements,
              designDecisions: payload.designDecisions,
            }));
          }}
        />

        <ObservablesLayerWidget
          flows={draftFlows}
          contexts={draftContexts}
          observables={draftObservables}
          editing={editing}
          onChange={(payload) => {
            setDraftModifications((prev) => ({
              ...prev,
              flows: payload.flows,
              contexts: payload.contexts,
              observables: payload.observables,
            }));
          }}
        />

        <ContractsLayerWidget
          contracts={draftContracts}
          tooling={draftTooling}
          editing={editing}
          onChange={(payload) => {
            setDraftModifications((prev) => ({
              ...prev,
              contracts: payload.contracts,
              toolingRequirements: payload.toolingRequirements,
            }));
          }}
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
                  onModify({ modifications: draftModifications });
                }}
              />
              <PixelBtnWidget
                label={CANCEL_LABEL}
                variant={GHOST_VARIANT}
                onClick={() => {
                  setEditing(false);
                  setDraftModifications({});
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
                  setDraftModifications({});
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

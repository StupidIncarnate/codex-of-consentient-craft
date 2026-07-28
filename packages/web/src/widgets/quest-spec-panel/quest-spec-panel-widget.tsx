/**
 * PURPOSE: Renders the quest spec panel with title bar, scrollable content area, and an action bar for approving quest specs
 *
 * USAGE:
 * <QuestSpecPanelWidget quest={quest} onModify={handleModify} />
 * // Renders panel with gated sections, user request display, and approve control
 */

import { Box, Group, Stack, Text } from '@mantine/core';

import type { Quest } from '@dungeonmaster/shared/contracts';
import { hasQuestGateContentGuard } from '@dungeonmaster/shared/guards';
import {
  displayHeaderQuestStatusTransformer,
  nextApprovalQuestStatusTransformer,
} from '@dungeonmaster/shared/transformers';

import type { AskUserQuestionItem } from '@dungeonmaster/shared/contracts';
import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { GateSectionKey } from '../../contracts/gate-section-key/gate-section-key-contract';
import { isGateSectionVisibleGuard } from '../../guards/is-gate-section-visible/is-gate-section-visible-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

import { OperationsLedgerWidget } from '../operations-ledger/operations-ledger-widget';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { QuestClarifyPanelWidget } from '../quest-clarify-panel/quest-clarify-panel-widget';
import { QuestTitleBarWidget } from '../quest-title-bar/quest-title-bar-widget';
import { ContractsLayerWidget } from './contracts-layer-widget';
import { DesignDecisionsLayerWidget } from './design-decisions-layer-widget';
import { FlowsLayerWidget } from './flows-layer-widget';

const APPROVE_LABEL = 'APPROVE' as ButtonLabel;
const SCROLLABLE_STYLE = { flex: 1, overflowY: 'auto' as const, padding: 16 };
const ACTION_BAR_STYLE_BASE = { padding: 12, flexShrink: 0 };
const HEADER_FONT_SIZE = 'xs' as const;

const CONTRACTS_SECTION = 'contracts' as GateSectionKey;

export interface QuestSpecPanelWidgetProps {
  quest: Quest;
  onModify?: (params: {
    modifications: Record<string, unknown>;
    action: 'approve';
    nextStatus?: string;
  }) => void;
  readOnly?: boolean;
  pendingQuestion?: {
    questions: AskUserQuestionItem[];
  } | null;
  onSubmitAnswers?: (params: {
    answers: {
      header: AskUserQuestionItem['header'];
      question: AskUserQuestionItem['question'];
      label: string;
    }[];
  }) => void;
  onAbandon?: () => void;
}

export const QuestSpecPanelWidget = ({
  quest,
  onModify,
  readOnly,
  pendingQuestion,
  onSubmitAnswers,
  onAbandon,
}: QuestSpecPanelWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Stack gap={0} style={{ height: '100%' }} data-testid="QUEST_SPEC_PANEL">
      <QuestTitleBarWidget title={quest.title} {...(onAbandon ? { onAbandon } : {})} />
      <Box style={SCROLLABLE_STYLE}>
        <Text
          ff="monospace"
          size={HEADER_FONT_SIZE}
          fw={600}
          mb="md"
          style={{ color: colors.primary }}
          data-testid="PANEL_HEADER"
        >
          {displayHeaderQuestStatusTransformer({ status: quest.status })}
        </Text>

        {quest.userRequest ? (
          <Box mb="md" data-testid="USER_REQUEST_SECTION">
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              mb={4}
              style={{ color: colors['text-dim'] }}
            >
              USER REQUEST
            </Text>
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              style={{ color: colors.text, whiteSpace: 'pre-wrap' }}
              data-testid="USER_REQUEST_TEXT"
            >
              {quest.userRequest}
            </Text>
          </Box>
        ) : null}

        <DesignDecisionsLayerWidget designDecisions={quest.designDecisions} />

        <FlowsLayerWidget flows={quest.flows} contracts={quest.contracts} />

        {quest.operations.length > 0 ? (
          <Box mb="md" data-testid="OPERATIONS_SECTION">
            <Text
              ff="monospace"
              size={HEADER_FONT_SIZE}
              fw={600}
              mb={4}
              style={{ color: colors['text-dim'] }}
            >
              OPERATIONS
            </Text>
            <OperationsLedgerWidget operations={quest.operations} flows={quest.flows} />
          </Box>
        ) : null}

        {isGateSectionVisibleGuard({ status: quest.status, section: CONTRACTS_SECTION }) ? (
          <ContractsLayerWidget tooling={quest.toolingRequirements} />
        ) : null}
      </Box>
      {readOnly ? null : (
        <Box
          style={{
            ...ACTION_BAR_STYLE_BASE,
            borderTop: `1px solid ${colors.border}`,
          }}
          data-testid="ACTION_BAR"
        >
          {pendingQuestion && onSubmitAnswers ? (
            <QuestClarifyPanelWidget
              questions={pendingQuestion.questions}
              questTitle={quest.title as unknown as AskUserQuestionItem['question']}
              onSubmitAnswers={onSubmitAnswers}
            />
          ) : (
            <Group gap="xs">
              {(() => {
                const nextApproval = nextApprovalQuestStatusTransformer({
                  status: quest.status,
                });
                if (!nextApproval) {
                  return null;
                }
                return (
                  <PixelBtnWidget
                    label={APPROVE_LABEL}
                    disabled={!hasQuestGateContentGuard({ quest, nextStatus: nextApproval })}
                    onClick={() => {
                      if (onModify) {
                        onModify({
                          modifications: { status: nextApproval },
                          action: 'approve',
                          nextStatus: nextApproval,
                        });
                      }
                    }}
                  />
                );
              })()}
            </Group>
          )}
        </Box>
      )}
    </Stack>
  );
};

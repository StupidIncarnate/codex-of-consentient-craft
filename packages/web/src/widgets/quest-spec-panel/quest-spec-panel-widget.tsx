/**
 * PURPOSE: Renders the quest spec panel with title bar, scrollable content area, and an action bar for approving quest specs
 *
 * USAGE:
 * <QuestSpecPanelWidget quest={quest} onModify={handleModify} onSendComments={sendCommentBatch} />
 * // Renders panel with gated sections, user request display, approve control, and — while the
 * // quest is still composable — the queued-comment bar pinned above the action bar
 *
 * <QuestSpecPanelWidget quest={quest} readOnly={true} />
 * // Same panel with no action bar and no queue bar. The props are a discriminated union on
 * // `readOnly`: the read-only arm types `onSendComments` as `never` so a read-only panel cannot be
 * // handed a send path, and the interactive arm REQUIRES one so a panel that renders Send always
 * // has somewhere to deliver. "Read-only never sends" is therefore a compile error, not a guard.
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
import { isCommentComposeAllowedGuard } from '../../guards/is-comment-compose-allowed/is-comment-compose-allowed-guard';
import { isGateSectionVisibleGuard } from '../../guards/is-gate-section-visible/is-gate-section-visible-guard';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

import type { CommentBatchSendResult } from '../../contracts/comment-batch-send-result/comment-batch-send-result-contract';
import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { CommentQueueBarWidget } from '../comment-queue-bar/comment-queue-bar-widget';
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

// The props every panel carries, whatever its mode. The `readOnly` / `onSendComments` pair is the
// only thing that varies, and it varies together — see QuestSpecPanelWidgetProps below.
interface QuestSpecPanelSharedProps {
  quest: Quest;
  onModify?: (params: {
    modifications: Record<string, unknown>;
    action: 'approve';
    nextStatus?: string;
  }) => void;
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

// useQuestChatBinding's sendCommentBatch, threaded down so the queue bar never calls the broker
// directly — the binding is what puts the sent batch in the chat panel without a reload.
type QuestSpecPanelSendComments = (params: {
  comments: readonly CommentQueueEntry[];
}) => Promise<CommentBatchSendResult>;

// Discriminated on `readOnly`, so the invariant lives in the type: a read-only panel renders no
// Send affordance and is given no way to deliver one (`onSendComments?: never` rejects the prop
// outright), while every other panel must supply the send path the queue bar's Send button calls.
export type QuestSpecPanelWidgetProps =
  | (QuestSpecPanelSharedProps & { readOnly: true; onSendComments?: never })
  | (QuestSpecPanelSharedProps & { readOnly?: false; onSendComments: QuestSpecPanelSendComments });

export const QuestSpecPanelWidget = ({
  quest,
  onModify,
  readOnly,
  pendingQuestion,
  onSendComments,
  onSubmitAnswers,
  onAbandon,
}: QuestSpecPanelWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  // One gate, evaluated once and threaded down as the presence of an id. Queueing and sending are
  // spec-review tools, and a quest with no resumable chat session could never deliver the batch.
  const commentQuestId = isCommentComposeAllowedGuard({ quest }) ? quest.id : undefined;

  return (
    <Stack gap={0} style={{ height: '100%' }} data-testid="QUEST_SPEC_PANEL">
      <QuestTitleBarWidget title={quest.title} {...(onAbandon ? { onAbandon } : {})} />
      <Box style={SCROLLABLE_STYLE} data-testid="QUEST_SPEC_PANEL_CONTENT">
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

        <FlowsLayerWidget
          flows={quest.flows}
          contracts={quest.contracts}
          comments={quest.comments}
          {...(commentQuestId === undefined ? {} : { commentQuestId })}
        />

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
      {readOnly || commentQuestId === undefined ? null : (
        // Sibling directly above ACTION_BAR inside the panel's flex column, OUTSIDE the scrollable
        // content box — that placement plus the bar's own flexShrink:0 is what keeps the queued
        // count on screen no matter how far the spec is scrolled. Ruling out `readOnly` here also
        // narrows the props to the arm that carries `onSendComments`.
        <CommentQueueBarWidget questId={commentQuestId} onSend={onSendComments} />
      )}
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

/**
 * PURPOSE: The quest spec as a working surface rather than a document — SPEC pins the user request
 * over a flow view sized to the panel, DETAILS parks the design decisions, operations and tooling a
 * reviewer consults once. The SAME widget serves quest making and execution (readOnly), which is
 * what keeps the two from drifting; `readOnly` is the only prop that changes what renders.
 *
 * USAGE:
 * <QuestSpecPanelWidget quest={quest} onModify={handleModify} onSendComments={sendCommentBatch} />
 * // Renders both tabs, the approve control, and — while the quest is still composable — the
 * // queued-comment bar pinned above the action bar, outside the tab content so neither tab hides it
 *
 * <QuestSpecPanelWidget quest={quest} readOnly={true} />
 * // Same panel with no action bar and no queue bar. The props are a discriminated union on
 * // `readOnly`: the read-only arm types `onSendComments` as `never` so a read-only panel cannot be
 * // handed a send path, and the interactive arm REQUIRES one so a panel that renders Send always
 * // has somewhere to deliver. "Read-only never sends" is therefore a compile error, not a guard.
 */

import { useState } from 'react';

import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';

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

// SPEC is the working surface — the request being satisfied, and the diagram satisfying it.
// DETAILS holds the prose a reader consults once and then wants out of the way.
const TABS = [
  { id: 'spec', label: 'SPEC' },
  { id: 'details', label: 'DETAILS' },
] as const;

// Matches the execution panel's tab row, which this one nests directly beneath.
const TAB_FONT_SIZE = 10;
const TAB_FONT_WEIGHT = 600;
const ACTIVE_BORDER_WIDTH = 2;
const TAB_PADDING_VERTICAL = 5;

// SPEC hands its leftover height to FlowsLayerWidget, which hands it to the canvas — so in a window
// with room it does not scroll at all. `overflowY: auto` is the escape hatch for the window that
// has NO room: the diagram refuses to shrink past its own floor, and this is what turns that
// refusal into a scrollbar instead of a canvas clipped off the bottom of the panel.
const SPEC_TAB_STYLE = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  overflowY: 'auto' as const,
  padding: 16,
};
// Capped rather than free-growing: an essay-length request would otherwise push the diagram —
// the thing the tab exists to show — off the bottom of the panel.
const USER_REQUEST_STYLE = {
  flexShrink: 0,
  maxHeight: 120,
  overflowY: 'auto' as const,
  marginBottom: 16,
};
const PANEL_HEADER_STYLE = { flexShrink: 0 };

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
  const [activeTab, setActiveTab] = useState<'spec' | 'details'>('spec');
  const { colors } = emberDepthsThemeStatics;

  // A comment's anchor is box identity — flowId + nodeId (+ observableId) — which is spec data, so
  // no work item, sessionId, or dispatch history participates in whether a box is commentable. The
  // ONE thing that suppresses the compose affordance is a readOnly diagram: the execution panel's
  // QUEST SPEC tab, where the spec is approved and frozen. Comment count badges are a read
  // affordance and keep rendering there regardless (FlowsLayerWidget takes `comments` separately).
  const commentQuestId = readOnly === true ? undefined : quest.id;

  return (
    // minHeight:0 so this panel can shrink to whatever its host left it. Without it a flex item's
    // automatic minimum size floors it at content height, and the diagram — which now sizes itself
    // FROM the panel — would be the content deciding how tall the panel is.
    <Stack gap={0} style={{ height: '100%', minHeight: 0 }} data-testid="QUEST_SPEC_PANEL">
      <QuestTitleBarWidget title={quest.title} {...(onAbandon ? { onAbandon } : {})} />
      <Box
        data-testid="QUEST_SPEC_TAB_BAR"
        style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {TABS.map((tab) => (
          <UnstyledButton
            key={tab.id}
            data-testid={`QUEST_SPEC_TAB_${tab.id}`}
            data-active={activeTab === tab.id ? 'true' : undefined}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            px="sm"
            py={TAB_PADDING_VERTICAL}
            style={{
              fontFamily: 'monospace',
              fontSize: TAB_FONT_SIZE,
              fontWeight: TAB_FONT_WEIGHT,
              color: activeTab === tab.id ? colors.primary : colors['text-dim'],
              borderBottom:
                activeTab === tab.id
                  ? `${ACTIVE_BORDER_WIDTH}px solid ${colors.primary}`
                  : `${ACTIVE_BORDER_WIDTH}px solid transparent`,
            }}
          >
            {tab.label}
          </UnstyledButton>
        ))}
      </Box>

      {activeTab === 'spec' ? (
        <Box style={SPEC_TAB_STYLE} data-testid="QUEST_SPEC_PANEL_CONTENT">
          <Text
            ff="monospace"
            size={HEADER_FONT_SIZE}
            fw={600}
            mb="md"
            style={{ color: colors.primary, ...PANEL_HEADER_STYLE }}
            data-testid="PANEL_HEADER"
          >
            {displayHeaderQuestStatusTransformer({ status: quest.status })}
          </Text>

          {quest.userRequest ? (
            <Box style={USER_REQUEST_STYLE} data-testid="USER_REQUEST_SECTION">
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

          <FlowsLayerWidget
            flows={quest.flows}
            contracts={quest.contracts}
            comments={quest.comments}
            {...(commentQuestId === undefined ? {} : { commentQuestId })}
          />
        </Box>
      ) : (
        <Box style={SCROLLABLE_STYLE} data-testid="QUEST_SPEC_DETAILS_CONTENT">
          <DesignDecisionsLayerWidget designDecisions={quest.designDecisions} />

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
      )}
      {readOnly ? null : (
        // Sibling directly above ACTION_BAR inside the panel's flex column, OUTSIDE the tab
        // content — that placement plus the bar's own flexShrink:0 is what keeps the queued count
        // on screen whichever tab is showing and however far DETAILS is scrolled. Ruling out
        // `readOnly` here also narrows the props to the arm that carries `onSendComments`.
        <CommentQueueBarWidget questId={quest.id} onSend={onSendComments} />
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

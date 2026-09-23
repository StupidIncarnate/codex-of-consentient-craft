/**
 * PURPOSE: Renders one quest row with its status color, a terminal-state fade, and — for a
 * deletable status — its own skull delete control and confirmation popover.
 *
 * USAGE:
 * <QuestRowLayerWidget quest={quest} confirmingQuestId={confirmingQuestId}
 *   onConfirmingQuestIdChange={onConfirmingQuestIdChange} onSelectQuest={onSelectQuest}
 *   onDeleteQuest={onDeleteQuest} deletingQuestId={deletingQuestId} />
 * // Renders the quest title, a colored status badge, and (when deletable) a skull delete control
 */

import { Box, Button, Group, Popover, Stack, Text } from '@mantine/core';
import { IconSkull } from '@tabler/icons-react';

import {
  isPreExecutionQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import type { QuestId, QuestListItem, QuestStatus } from '@dungeonmaster/shared/contracts';

import { buttonLabelContract } from '../../contracts/button-label/button-label-contract';
import { buttonVariantContract } from '../../contracts/button-variant/button-variant-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { IconButtonWidget } from '../icon-button/icon-button-widget';

export interface QuestRowLayerWidgetProps {
  quest: QuestListItem;
  confirmingQuestId: QuestId | null;
  onConfirmingQuestIdChange: (params: { questId: QuestId | null }) => void;
  onSelectQuest: (params: { questId: QuestId }) => void;
  onDeleteQuest: (params: { questId: QuestId }) => void;
  deletingQuestId: QuestId | null;
}

const { colors } = emberDepthsThemeStatics;
const ITEM_FONT_SIZE = 12;
const STATUS_FONT_SIZE = 10;
const TERMINAL_ROW_OPACITY = 0.5;
const TERMINAL_STATUSES = new Set(['abandoned']);
const DANGER_VARIANT = buttonVariantContract.parse('danger');
const DELETE_QUEST_LABEL = buttonLabelContract.parse('Delete quest');

const ROW_BASE_STYLE = {
  fontFamily: 'monospace' as const,
  fontSize: ITEM_FONT_SIZE,
  color: colors.text,
  borderRadius: 2,
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  gap: 12,
};

const STATUS_COLOR_MAP = new Map<QuestStatus, (typeof colors)[keyof typeof colors]>([
  ['created', colors.warning],
  ['pending', colors.warning],
  ['explore_flows', colors.warning],
  ['flows_approved', colors.warning],
  ['explore_observables', colors.warning],
  ['review_flows', colors['loot-gold']],
  ['review_observables', colors['loot-gold']],
  ['approved', colors['loot-rare']],
  ['in_progress', colors.primary],
  ['paused', colors.warning],
  ['merging', colors.primary],
  ['complete', colors.success],
  ['merged', colors.success],
  ['blocked', colors.danger],
  ['abandoned', colors['text-dim']],
]);

export const QuestRowLayerWidget = ({
  quest,
  confirmingQuestId,
  onConfirmingQuestIdChange,
  onSelectQuest,
  onDeleteQuest,
  deletingQuestId,
}: QuestRowLayerWidgetProps): React.JSX.Element => {
  const isTerminal = TERMINAL_STATUSES.has(quest.status);
  const isDeletable =
    isTerminalQuestStatusGuard({ status: quest.status }) ||
    isUserPausedQuestStatusGuard({ status: quest.status }) ||
    isPreExecutionQuestStatusGuard({ status: quest.status });

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => {
        onSelectQuest({ questId: quest.id });
      }}
      px="xs"
      py={3}
      data-testid={`QUEST_ITEM_${quest.id}`}
      style={{
        ...ROW_BASE_STYLE,
        cursor: 'pointer',
        opacity: isTerminal ? TERMINAL_ROW_OPACITY : 1,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{quest.title}</span>
      <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
        <span
          data-testid={`QUEST_STATUS_${quest.id}`}
          style={{
            color: STATUS_COLOR_MAP.get(quest.status) ?? colors['text-dim'],
            fontSize: STATUS_FONT_SIZE,
          }}
        >
          {quest.status.toUpperCase().split('_').join(' ')}
        </span>
        {isDeletable && (
          <Popover
            opened={confirmingQuestId === quest.id}
            onChange={(opened) => {
              onConfirmingQuestIdChange({ questId: opened ? quest.id : null });
            }}
            position="bottom-end"
            withArrow
            trapFocus
            withinPortal
            transitionProps={{ duration: 0 }}
          >
            <Popover.Target>
              <IconButtonWidget
                label={DELETE_QUEST_LABEL}
                testId={testIdContract.parse(`QUEST_DELETE_${String(quest.id)}`)}
                icon={IconSkull}
                variant={DANGER_VARIANT}
                onClick={(event) => {
                  event.stopPropagation();
                  onConfirmingQuestIdChange({
                    questId: confirmingQuestId === quest.id ? null : quest.id,
                  });
                }}
              />
            </Popover.Target>
            <Popover.Dropdown
              data-testid={`QUEST_DELETE_POPOVER_${quest.id}`}
              style={{
                background: colors['bg-raised'],
                borderColor: colors.border,
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Stack gap={8}>
                <Text ff="monospace" size="xs" style={{ color: colors.text }}>
                  {`Deleting ${quest.title} is permanent. Are you sure?`}
                </Text>
                <Group gap={8} justify="flex-end">
                  <Button
                    size="xs"
                    variant="default"
                    onClick={(event) => {
                      event.stopPropagation();
                      onConfirmingQuestIdChange({ questId: null });
                    }}
                  >
                    Spare
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    disabled={deletingQuestId === quest.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteQuest({ questId: quest.id });
                    }}
                  >
                    Banish
                  </Button>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        )}
      </Group>
    </Box>
  );
};

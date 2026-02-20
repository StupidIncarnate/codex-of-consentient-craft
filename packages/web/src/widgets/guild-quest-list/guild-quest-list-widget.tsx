/**
 * PURPOSE: Renders a list of quests with status indicators and add button
 *
 * USAGE:
 * <GuildQuestListWidget quests={quests} onSelect={handleSelect} onAdd={handleAdd} />
 * // Renders QUESTS header with quest list showing titles and status colors
 */

import { Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type { QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import type { QuestListItem } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import type { TempSessionItem } from '../../contracts/temp-session-item/temp-session-item-contract';

export interface GuildQuestListWidgetProps {
  quests: readonly QuestListItem[];
  tempSessions?: readonly TempSessionItem[];
  onSelect: (params: { questId: QuestId }) => void;
  onSelectSession?: (params: { sessionId: SessionId }) => void;
  onAdd: () => void;
}

const ITEM_FONT_SIZE = 12;
const STATUS_FONT_SIZE = 10;
const { colors } = emberDepthsThemeStatics;

const STATUS_COLORS = {
  complete: colors.success,
  in_progress: colors.warning,
  pending: colors['text-dim'],
  blocked: colors.danger,
  abandoned: colors.danger,
} as const;

export const GuildQuestListWidget = ({
  quests,
  tempSessions,
  onSelect,
  onSelectSession,
  onAdd,
}: GuildQuestListWidgetProps): React.JSX.Element => (
  <Stack gap={4} data-testid="GUILD_QUEST_LIST">
    <Group justify="space-between">
      <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
        QUESTS
      </Text>
      <PixelBtnWidget
        label={'+' as ButtonLabel}
        onClick={onAdd}
        variant={'ghost' as ButtonVariant}
        icon
      />
    </Group>
    {tempSessions?.map((session) => (
      <UnstyledButton
        key={session.sessionId}
        onClick={() => {
          onSelectSession?.({ sessionId: session.sessionId });
        }}
        px="xs"
        py={3}
        data-testid={`TEMP_SESSION_${session.sessionId}`}
        style={{
          fontFamily: 'monospace',
          fontSize: ITEM_FONT_SIZE,
          color: colors.text,
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span>{session.title ?? 'Untitled session'}</span>
        <span
          data-testid={`TEMP_LABEL_${session.sessionId}`}
          style={{
            color: colors.warning,
            fontSize: STATUS_FONT_SIZE,
          }}
        >
          TEMP
        </span>
      </UnstyledButton>
    ))}
    {quests.length === 0 && (!tempSessions || tempSessions.length === 0) && (
      <Text
        ff="monospace"
        size="xs"
        style={{ color: colors['text-dim'] }}
        data-testid="QUEST_EMPTY_STATE"
      >
        No quests yet
      </Text>
    )}
    {quests.map((quest) => (
      <UnstyledButton
        key={quest.id}
        onClick={() => {
          onSelect({ questId: quest.id });
        }}
        px="xs"
        py={3}
        data-testid={`QUEST_ITEM_${quest.id}`}
        style={{
          fontFamily: 'monospace',
          fontSize: ITEM_FONT_SIZE,
          color: colors.text,
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span>{quest.title}</span>
        <span
          data-testid={`QUEST_STATUS_${quest.id}`}
          style={{
            color:
              (Reflect.get(STATUS_COLORS, quest.status) as
                | (typeof colors)['text-dim']
                | undefined) ?? colors['text-dim'],
            fontSize: STATUS_FONT_SIZE,
          }}
        >
          {quest.status.toUpperCase().split('_').join(' ')}
        </span>
      </UnstyledButton>
    ))}
  </Stack>
);

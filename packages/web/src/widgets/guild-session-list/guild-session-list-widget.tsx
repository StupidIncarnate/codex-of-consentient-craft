/**
 * PURPOSE: Renders a list of sessions with status indicators, quest badges, filter toggle, and add button
 *
 * USAGE:
 * <GuildSessionListWidget sessions={sessions} quests={quests} skippedQuestFiles={skipped} filter={filter} onFilterChange={handleFilter} onSelect={handleSelect} onSelectQuest={handleQuestSelect} onAdd={handleAdd} />
 * // Renders SESSIONS header. In "quests-only" mode shows one row per quest file; in "all" mode shows one row per session JSONL.
 *
 * Quest files the server could not read render as their own unreadable rows in BOTH modes, so the
 * row count matches the folder count on disk and a session whose quest is unreadable is explained
 * rather than silently presented as quest-less.
 */

import { Group, Loader, SegmentedControl, Stack, Text } from '@mantine/core';

import type {
  QuestId,
  QuestListItem,
  SessionId,
  SessionListItem,
  SkippedQuestFile,
} from '@dungeonmaster/shared/contracts';

import type { SessionFilter } from '../../contracts/session-filter/session-filter-contract';
import { sessionFilterContract } from '../../contracts/session-filter/session-filter-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { QuestRowLayerWidget } from './quest-row-layer-widget';
import { SessionRowLayerWidget } from './session-row-layer-widget';
import { UnreadableQuestRowLayerWidget } from './unreadable-quest-row-layer-widget';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';

export interface GuildSessionListWidgetProps {
  sessions: readonly SessionListItem[];
  quests: readonly QuestListItem[];
  skippedQuestFiles: readonly SkippedQuestFile[];
  loading: boolean;
  filter: SessionFilter;
  onFilterChange: (params: { filter: SessionFilter }) => void;
  onSelect: (params: { sessionId: SessionId }) => void;
  onSelectQuest: (params: { questId: QuestId }) => void;
  onAdd: () => void;
  confirmingQuestId: QuestId | null;
  onConfirmingQuestIdChange: (params: { questId: QuestId | null }) => void;
  onDeleteQuest: (params: { questId: QuestId }) => void;
  deletingQuestId: QuestId | null;
}

const { colors } = emberDepthsThemeStatics;

export const GuildSessionListWidget = ({
  sessions,
  quests,
  skippedQuestFiles,
  loading,
  filter,
  onFilterChange,
  onSelect,
  onSelectQuest,
  onAdd,
  confirmingQuestId,
  onConfirmingQuestIdChange,
  onDeleteQuest,
  deletingQuestId,
}: GuildSessionListWidgetProps): React.JSX.Element => {
  const isQuestMode = filter === 'quests-only';
  const hasRows = isQuestMode ? quests.length > 0 : sessions.length > 0;
  // An unreadable quest file is content, not emptiness — a guild whose only quest file is
  // unreadable must never render "No quests yet".
  const isEmpty = !hasRows && skippedQuestFiles.length === 0;

  return (
    <Stack gap={4} data-testid="GUILD_SESSION_LIST">
      <Group justify="space-between">
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          SESSIONS
        </Text>
        <PixelBtnWidget
          label={'+' as ButtonLabel}
          onClick={onAdd}
          variant={'ghost' as ButtonVariant}
          icon
        />
      </Group>
      <SegmentedControl
        data-testid="SESSION_FILTER"
        size="xs"
        value={filter}
        onChange={(value) => {
          onFilterChange({ filter: sessionFilterContract.parse(value) });
        }}
        data={[
          { label: 'Quests Only', value: 'quests-only' },
          { label: 'All', value: 'all' },
        ]}
      />
      {loading && <Loader size="xs" color={colors.warning} data-testid="SESSION_LOADER" />}
      {!loading && isEmpty && (
        <Text
          ff="monospace"
          size="xs"
          style={{ color: colors['text-dim'] }}
          data-testid="SESSION_EMPTY_STATE"
        >
          {isQuestMode ? 'No quests yet' : 'No sessions yet'}
        </Text>
      )}
      {!loading &&
        skippedQuestFiles.map((skippedQuestFile) => (
          <UnreadableQuestRowLayerWidget
            key={skippedQuestFile.questFolder}
            skippedQuestFile={skippedQuestFile}
          />
        ))}
      {!loading &&
        isQuestMode &&
        quests.map((quest) => (
          <QuestRowLayerWidget
            key={quest.id}
            quest={quest}
            confirmingQuestId={confirmingQuestId}
            onConfirmingQuestIdChange={onConfirmingQuestIdChange}
            onSelectQuest={onSelectQuest}
            onDeleteQuest={onDeleteQuest}
            deletingQuestId={deletingQuestId}
          />
        ))}
      {!loading &&
        !isQuestMode &&
        sessions.map((session) => (
          <SessionRowLayerWidget key={session.sessionId} session={session} onSelect={onSelect} />
        ))}
    </Stack>
  );
};

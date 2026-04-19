/**
 * PURPOSE: Renders a list of sessions with status indicators, quest badges, filter toggle, and add button
 *
 * USAGE:
 * <GuildSessionListWidget sessions={sessions} filter={filter} onFilterChange={handleFilter} onSelect={handleSelect} onAdd={handleAdd} />
 * // Renders SESSIONS header with session list showing summaries and status indicators
 */

import { Badge, Group, Loader, SegmentedControl, Stack, Text, UnstyledButton } from '@mantine/core';

import type { SessionId, SessionListItem } from '@dungeonmaster/shared/contracts';

import type { SessionFilter } from '../../contracts/session-filter/session-filter-contract';
import { sessionFilterContract } from '../../contracts/session-filter/session-filter-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';

export interface GuildSessionListWidgetProps {
  sessions: readonly SessionListItem[];
  loading: boolean;
  filter: SessionFilter;
  onFilterChange: (params: { filter: SessionFilter }) => void;
  onSelect: (params: { sessionId: SessionId }) => void;
  onAdd: () => void;
}

const ITEM_FONT_SIZE = 12;
const STATUS_FONT_SIZE = 10;
const { colors } = emberDepthsThemeStatics;

const STATUS_COLORS = {
  created: colors.warning,
  pending: colors.warning,
  explore_flows: colors.warning,
  flows_approved: colors.warning,
  explore_observables: colors.warning,
  explore_design: colors.warning,
  review_flows: colors['loot-gold'],
  review_observables: colors['loot-gold'],
  review_design: colors['loot-gold'],
  approved: colors['loot-rare'],
  design_approved: colors['loot-rare'],
  seek_scope: colors['seek-scope'],
  seek_synth: colors['seek-synth'],
  seek_walk: colors['seek-walk'],
  seek_plan: colors['seek-plan'],
  in_progress: colors.primary,
  complete: colors.success,
  blocked: colors.danger,
  abandoned: colors['text-dim'],
} as const;

const TERMINAL_ROW_OPACITY = 0.5;
const TERMINAL_STATUSES = new Set(['abandoned']);

export const GuildSessionListWidget = ({
  sessions,
  loading,
  filter,
  onFilterChange,
  onSelect,
  onAdd,
}: GuildSessionListWidgetProps): React.JSX.Element => {
  const filtered =
    filter === 'quests-only' ? sessions.filter((s) => s.questId !== undefined) : sessions;

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
      {!loading && filtered.length === 0 && (
        <Text
          ff="monospace"
          size="xs"
          style={{ color: colors['text-dim'] }}
          data-testid="SESSION_EMPTY_STATE"
        >
          No sessions yet
        </Text>
      )}
      {!loading &&
        filtered.map((session) => {
          const isTerminal =
            session.questStatus !== undefined && TERMINAL_STATUSES.has(session.questStatus);
          return (
            <UnstyledButton
              key={session.sessionId}
              onClick={() => {
                onSelect({ sessionId: session.sessionId });
              }}
              px="xs"
              py={3}
              data-testid={`SESSION_ITEM_${session.sessionId}`}
              style={{
                fontFamily: 'monospace',
                fontSize: ITEM_FONT_SIZE,
                color: colors.text,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                opacity: isTerminal ? TERMINAL_ROW_OPACITY : 1,
              }}
            >
              <span style={{ flex: 1, minWidth: 0 }}>
                {session.questTitle ?? session.summary ?? 'Untitled session'}
              </span>
              <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                {session.questTitle ? (
                  <Badge
                    size="xs"
                    variant="outline"
                    data-testid={`SESSION_QUEST_BADGE_${session.sessionId}`}
                  >
                    QUEST
                  </Badge>
                ) : null}
                {session.questStatus ? (
                  <span
                    data-testid={`SESSION_STATUS_${session.sessionId}`}
                    style={{
                      color:
                        (Reflect.get(STATUS_COLORS, session.questStatus) as
                          | (typeof colors)['text-dim']
                          | undefined) ?? colors['text-dim'],
                      fontSize: STATUS_FONT_SIZE,
                    }}
                  >
                    {session.questStatus.toUpperCase().split('_').join(' ')}
                  </span>
                ) : null}
              </Group>
            </UnstyledButton>
          );
        })}
    </Stack>
  );
};

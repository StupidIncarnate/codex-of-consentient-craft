/**
 * PURPOSE: Renders one session row with its quest badge and status color, fading the row when its
 * linked quest ended in a terminal status.
 *
 * USAGE:
 * <SessionRowLayerWidget session={session} onSelect={onSelect} />
 * // Renders the session summary, an optional QUEST badge, and an optional status label
 */

import { Badge, Group, UnstyledButton } from '@mantine/core';

import type { QuestStatus, SessionId, SessionListItem } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface SessionRowLayerWidgetProps {
  session: SessionListItem;
  onSelect: (params: { sessionId: SessionId }) => void;
}

const { colors } = emberDepthsThemeStatics;
const ITEM_FONT_SIZE = 12;
const STATUS_FONT_SIZE = 10;
const TERMINAL_ROW_OPACITY = 0.5;
const TERMINAL_STATUSES = new Set(['abandoned']);

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

export const SessionRowLayerWidget = ({
  session,
  onSelect,
}: SessionRowLayerWidgetProps): React.JSX.Element => {
  const isTerminal =
    session.questStatus !== undefined && TERMINAL_STATUSES.has(session.questStatus);

  return (
    <UnstyledButton
      onClick={() => {
        onSelect({ sessionId: session.sessionId });
      }}
      px="xs"
      py={3}
      data-testid={`SESSION_ITEM_${session.sessionId}`}
      style={{ ...ROW_BASE_STYLE, opacity: isTerminal ? TERMINAL_ROW_OPACITY : 1 }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{session.summary ?? 'Untitled session'}</span>
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
                STATUS_COLOR_MAP.get(session.questStatus as unknown as QuestStatus) ??
                colors['text-dim'],
              fontSize: STATUS_FONT_SIZE,
            }}
          >
            {session.questStatus.toUpperCase().split('_').join(' ')}
          </span>
        ) : null}
      </Group>
    </UnstyledButton>
  );
};

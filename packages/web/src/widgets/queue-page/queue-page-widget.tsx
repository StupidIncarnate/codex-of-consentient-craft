/**
 * PURPOSE: Full-page view of the cross-guild quest execution queue. Lists every queued entry
 * as a Link to `/:guildSlug/quest/:questId` with title, status, and guild slug, surfaces the
 * queue runner error when the head entry has one, and hosts the Node dispatcher play/pause
 * toggle.
 *
 * USAGE:
 * <QueuePageWidget />
 * // Renders the queue list page content inside the app layout.
 */

import { Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

import { useQuestQueueBinding } from '../../bindings/use-quest-queue/use-quest-queue-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { DispatchToggleWidget } from '../dispatch-toggle/dispatch-toggle-widget';

const ROW_FONT_SIZE = 13;
const TITLE_FONT_SIZE = 16;
const BORDER_WIDTH = 1;
const ROW_PADDING_Y = 8;
const ROW_PADDING_X = 12;
const PAGE_PADDING = 16;
const ERROR_BADGE_SIZE = 10;

export const QueuePageWidget = (): React.JSX.Element => {
  const { allEntries, errorEntry, isLoading } = useQuestQueueBinding();
  const { colors } = emberDepthsThemeStatics;
  const total = allEntries.length;

  return (
    <Stack
      gap="md"
      data-testid="QUEUE_PAGE"
      style={{
        padding: PAGE_PADDING,
        color: colors.text,
        fontFamily: 'monospace',
      }}
    >
      <Group justify="space-between" align="center">
        <Text
          size="md"
          ff="monospace"
          fw={700}
          c={colors['loot-gold']}
          data-testid="QUEUE_PAGE_TITLE"
          style={{ fontSize: TITLE_FONT_SIZE }}
        >
          EXECUTION QUEUE
        </Text>
        <DispatchToggleWidget />
      </Group>

      {errorEntry ? (
        <Group
          gap={8}
          data-testid="QUEUE_PAGE_ERROR"
          style={{
            border: `${BORDER_WIDTH}px solid ${colors.danger}`,
            backgroundColor: colors['bg-raised'],
            padding: `${ROW_PADDING_Y}px ${ROW_PADDING_X}px`,
          }}
        >
          <span
            aria-label="Queue runner error"
            style={{
              display: 'inline-block',
              width: ERROR_BADGE_SIZE,
              height: ERROR_BADGE_SIZE,
              borderRadius: ERROR_BADGE_SIZE,
              backgroundColor: colors.danger,
            }}
          />
          <Text size="xs" ff="monospace" c={colors.danger} data-testid="QUEUE_PAGE_ERROR_MESSAGE">
            {errorEntry.error?.message ?? ''}
          </Text>
        </Group>
      ) : null}

      {isLoading ? (
        <Text size="xs" ff="monospace" c={colors['text-dim']} data-testid="QUEUE_PAGE_LOADING">
          Loading queue...
        </Text>
      ) : null}

      {!isLoading && total === 0 ? (
        <Text size="xs" ff="monospace" c={colors['text-dim']} data-testid="QUEUE_PAGE_EMPTY">
          The queue is empty.
        </Text>
      ) : null}

      {total > 0 ? (
        <Stack
          gap={0}
          data-testid="QUEUE_PAGE_LIST"
          style={{
            border: `${BORDER_WIDTH}px solid ${colors.border}`,
            backgroundColor: colors['bg-surface'],
          }}
        >
          {allEntries.map((entry, index) => {
            const isActive = index === 0;
            const rowHasError = entry.error !== undefined;
            const href = `/${entry.guildSlug}/quest/${entry.questId}`;
            return (
              <Link
                key={entry.questId}
                to={href}
                data-testid={`QUEUE_PAGE_ROW_${entry.questId.toUpperCase()}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: `${ROW_PADDING_Y}px ${ROW_PADDING_X}px`,
                  color: isActive ? colors['loot-gold'] : colors.text,
                  backgroundColor: isActive ? colors['bg-raised'] : 'transparent',
                  borderLeft: `${BORDER_WIDTH}px solid ${
                    isActive ? colors['loot-gold'] : 'transparent'
                  }`,
                  borderBottom: `${BORDER_WIDTH}px solid ${colors.border}`,
                  fontFamily: 'monospace',
                  fontSize: ROW_FONT_SIZE,
                  textDecoration: 'none',
                }}
              >
                <span data-testid={`QUEUE_PAGE_ROW_POSITION_${entry.questId.toUpperCase()}`}>
                  {`${index + 1}/${total}`}
                </span>
                <span data-testid={`QUEUE_PAGE_ROW_TITLE_${entry.questId.toUpperCase()}`}>
                  {entry.questTitle}
                </span>
                <span
                  data-testid={`QUEUE_PAGE_ROW_STATUS_${entry.questId.toUpperCase()}`}
                  style={{ color: colors['text-dim'] }}
                >
                  {entry.status}
                </span>
                <span
                  data-testid={`QUEUE_PAGE_ROW_GUILD_${entry.questId.toUpperCase()}`}
                  style={{ color: colors['text-dim'] }}
                >
                  {entry.guildSlug}
                </span>
                {rowHasError ? (
                  <span
                    data-testid={`QUEUE_PAGE_ROW_ERROR_${entry.questId.toUpperCase()}`}
                    aria-label="Entry error"
                    title={entry.error?.message ?? ''}
                    style={{
                      display: 'inline-block',
                      width: ERROR_BADGE_SIZE,
                      height: ERROR_BADGE_SIZE,
                      borderRadius: ERROR_BADGE_SIZE,
                      backgroundColor: colors.danger,
                    }}
                  />
                ) : null}
              </Link>
            );
          })}
        </Stack>
      ) : null}
    </Stack>
  );
};

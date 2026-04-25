/**
 * PURPOSE: Top-sticky cross-guild quest execution queue bar. Collapsed view shows `Quest N/M — <title>` + optional error badge; expanded view lists every queued entry as a Link to `/:guildSlug/session/:sessionId`.
 *
 * USAGE:
 * <QuestQueueBarWidget />
 * // Renders nothing when the queue is empty; otherwise renders a fixed-position strip at the top of the viewport.
 */

import { Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useQuestQueueBinding } from '../../bindings/use-quest-queue/use-quest-queue-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const BAR_HEIGHT = 48;
const ROW_FONT_SIZE = 13;
const CHEVRON_SIZE = 14;
const ERROR_BADGE_SIZE = 10;
const BORDER_WIDTH = 1;
const ROW_PADDING_Y = 6;
const ROW_PADDING_X = 12;

export const QuestQueueBarWidget = (): React.JSX.Element | null => {
  const { activeEntry, allEntries, errorEntry } = useQuestQueueBinding();
  const [expanded, setExpanded] = useState(false);
  const { colors } = emberDepthsThemeStatics;

  if (allEntries.length === 0 || activeEntry === null) {
    return null;
  }

  const activeIndex = 0;
  const total = allEntries.length;
  const collapsedLabel = `Quest ${activeIndex + 1}/${total} — ${activeEntry.questTitle}`;
  const hasError = errorEntry !== undefined;
  const openHref =
    activeEntry.activeSessionId === undefined
      ? `/${activeEntry.guildSlug}/session`
      : `/${activeEntry.guildSlug}/session/${activeEntry.activeSessionId}`;

  return (
    <div
      data-testid="QUEST_QUEUE_BAR"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: colors['bg-raised'],
        borderBottom: `${BORDER_WIDTH}px solid ${colors.border}`,
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width: '100%',
          minHeight: BAR_HEIGHT,
          padding: `${ROW_PADDING_Y}px ${ROW_PADDING_X}px`,
          color: colors.text,
          fontFamily: 'monospace',
          fontSize: ROW_FONT_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <UnstyledButton
          data-testid="QUEST_QUEUE_BAR_TOGGLE"
          onClick={(): void => {
            setExpanded((prev) => !prev);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: colors.text,
            fontFamily: 'monospace',
            fontSize: ROW_FONT_SIZE,
            flex: 1,
            textAlign: 'left',
          }}
        >
          {hasError ? (
            <span
              data-testid="QUEST_QUEUE_BAR_ERROR_BADGE"
              aria-label="Queue runner error"
              title={errorEntry.error?.message ?? ''}
              style={{
                display: 'inline-block',
                width: ERROR_BADGE_SIZE,
                height: ERROR_BADGE_SIZE,
                borderRadius: ERROR_BADGE_SIZE,
                backgroundColor: colors.danger,
              }}
            />
          ) : null}
          <Text
            size="xs"
            ff="monospace"
            c={colors.text}
            data-testid="QUEST_QUEUE_BAR_COLLAPSED_LABEL"
          >
            {collapsedLabel}
          </Text>
        </UnstyledButton>
        <Group gap="md">
          <Link
            to={openHref}
            data-testid="QUEST_QUEUE_BAR_OPEN_LINK"
            style={{
              color: colors['loot-gold'],
              fontFamily: 'monospace',
              fontSize: ROW_FONT_SIZE,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            OPEN ▸
          </Link>
          <UnstyledButton
            data-testid="QUEST_QUEUE_BAR_CHEVRON_TOGGLE"
            onClick={(): void => {
              setExpanded((prev) => !prev);
            }}
            style={{
              fontFamily: 'monospace',
              fontSize: ROW_FONT_SIZE,
              color: colors['text-dim'],
            }}
          >
            <span data-testid="QUEST_QUEUE_BAR_CHEVRON">{expanded ? '▴' : '▾'}</span>
          </UnstyledButton>
        </Group>
      </div>

      {expanded ? (
        <Stack
          gap={0}
          data-testid="QUEST_QUEUE_BAR_EXPANDED_LIST"
          style={{
            borderTop: `${BORDER_WIDTH}px solid ${colors.border}`,
            backgroundColor: colors['bg-surface'],
          }}
        >
          {allEntries.map((entry, index) => {
            const isActive = index === activeIndex;
            const rowHasError = entry.error !== undefined;
            const href =
              entry.activeSessionId === undefined
                ? `/${entry.guildSlug}/session`
                : `/${entry.guildSlug}/session/${entry.activeSessionId}`;
            const rowLabel = `${index + 1}/${total} — ${entry.guildSlug} / ${entry.questTitle}`;
            return (
              <Link
                key={entry.questId}
                to={href}
                data-testid={`QUEST_QUEUE_BAR_ROW_${entry.questId.toUpperCase()}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: `${ROW_PADDING_Y}px ${ROW_PADDING_X}px`,
                  color: isActive ? colors['loot-gold'] : colors.text,
                  backgroundColor: isActive ? colors['bg-raised'] : 'transparent',
                  borderLeft: `${BORDER_WIDTH}px solid ${
                    isActive ? colors['loot-gold'] : 'transparent'
                  }`,
                  fontFamily: 'monospace',
                  fontSize: ROW_FONT_SIZE,
                  textDecoration: 'none',
                }}
              >
                {rowHasError ? (
                  <span
                    data-testid={`QUEST_QUEUE_BAR_ROW_ERROR_${entry.questId.toUpperCase()}`}
                    aria-label="Entry error"
                    title={entry.error?.message ?? ''}
                    style={{
                      display: 'inline-block',
                      width: ERROR_BADGE_SIZE,
                      height: ERROR_BADGE_SIZE,
                      borderRadius: ERROR_BADGE_SIZE,
                      backgroundColor: colors.danger,
                      marginRight: CHEVRON_SIZE - ERROR_BADGE_SIZE,
                    }}
                  />
                ) : null}
                <span>{rowLabel}</span>
              </Link>
            );
          })}
        </Stack>
      ) : null}
    </div>
  );
};

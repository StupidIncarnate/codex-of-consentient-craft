/**
 * PURPOSE: Full-page view of the cross-guild quest execution queue. Lists every queued entry
 * as a Link to `/:guildSlug/quest/:questId` with title, status, and guild slug, surfaces the
 * queue runner error when the head entry has one, and hosts the Node dispatcher play/pause
 * toggle beside the rate-limit windows that decide whether it may dispatch at all.
 *
 * The quota cards sit NEXT TO the toggle deliberately. This is the surface a reader opens when
 * the queue is not moving, and the guardrail is the commonest reason: how much of each window is
 * gone and when it recovers is the answer to that question, so it belongs beside the control
 * rather than only in the app's top bar where it reads as ambient decoration.
 *
 * USAGE:
 * <QueuePageWidget />
 * // Renders the queue list page content inside the app layout.
 */

import { Box, Group, Stack, Text } from '@mantine/core';

import { arrayIndexContract, totalCountContract } from '@dungeonmaster/shared/contracts';

import { useQuestQueueBinding } from '../../bindings/use-quest-queue/use-quest-queue-binding';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { DispatchToggleWidget } from '../dispatch-toggle/dispatch-toggle-widget';
import { RateLimitsStackWidget } from '../rate-limits-stack/rate-limits-stack-widget';
import { QueueRowLayerWidget } from './queue-row-layer-widget';

const TITLE_FONT_SIZE = 16;
const BORDER_WIDTH = 1;
const ROW_PADDING_Y = 8;
const ROW_PADDING_X = 12;
const PAGE_PADDING = 16;
const ERROR_BADGE_SIZE = 10;
const HEADER_GAP = 16;

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
        <Group gap={HEADER_GAP} align="center">
          {/* The app's top bar mounts this same stack, so the queue's copy is wrapped in a testid
              of its own — without it every locator for a card matches twice on this route. The
              wrapper paints nothing: a window with no learned ceiling renders no card at all,
              because 0% on a machine that has never been refused would be a lie. */}
          <Box data-testid="QUEUE_PAGE_RATE_LIMITS">
            <RateLimitsStackWidget />
          </Box>
          <DispatchToggleWidget />
        </Group>
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
          {allEntries.map((entry, index) => (
            <QueueRowLayerWidget
              key={entry.questId}
              entry={entry}
              index={arrayIndexContract.parse(index)}
              total={totalCountContract.parse(total)}
              isActive={index === 0}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
};

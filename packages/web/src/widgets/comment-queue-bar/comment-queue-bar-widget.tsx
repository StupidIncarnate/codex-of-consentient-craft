/**
 * PURPOSE: Renders the queue bar pinned directly above the quest spec panel's action bar once at
 * least one comment is queued for this quest — the queued count plus Clear and Send icon buttons.
 * The local queue survives every send failure and is cleared only on a 200
 * (#dd-persist-before-deliver); a 409 prunes exactly the anchors the server named as stale and
 * leaves every still-valid comment queued for a retry (#dd-stale-anchor-prunes-queue). Visibility
 * (status + resumable session) is gated by the parent that mounts this widget, not here
 * (#dd-toolbar-hidden-without-session).
 *
 * USAGE:
 * <CommentQueueBarWidget questId={questId} />
 * // Renders nothing while the queue is empty; renders the bar once entries.length > 0
 */

import { useState } from 'react';

import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { IconSend, IconTrash } from '@tabler/icons-react';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { mantineNotificationsShowAdapter } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter';
import { useCommentQueueBinding } from '../../bindings/use-comment-queue/use-comment-queue-binding';
import { questCommentBatchBroker } from '../../brokers/quest/comment-batch/quest-comment-batch-broker';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { staleAnchorNoticeTransformer } from '../../transformers/stale-anchor-notice/stale-anchor-notice-transformer';

const { colors } = emberDepthsThemeStatics;
const ICON_SIZE = 14;
const CONTAINER_STYLE = { padding: 12, flexShrink: 0 };
// The one generic fallback shown when the POST rejects before any response arrives (a network
// failure) — the same red Mantine toast the rest of the app raises for a failed broker call.
const NETWORK_ERROR_MESSAGE = 'Failed to send comments — check your connection and try again.';

export interface CommentQueueBarWidgetProps {
  questId: QuestId;
}

export const CommentQueueBarWidget = ({
  questId,
}: CommentQueueBarWidgetProps): React.JSX.Element | null => {
  const [sending, setSending] = useState(false);
  const { entries, deleteComment, clearQueue } = useCommentQueueBinding({ questId });

  if (entries.length === 0) {
    return null;
  }

  const count = entries.length;
  const countLabel = `${String(count)} COMMENT${count === 1 ? '' : 'S'} QUEUED`;

  return (
    <Box
      style={{ ...CONTAINER_STYLE, borderTop: `1px solid ${colors.border}` }}
      data-testid="COMMENT_QUEUE_BAR"
    >
      <Group justify="space-between" wrap="nowrap">
        <Text
          ff="monospace"
          size="xs"
          fw={600}
          data-testid="COMMENT_QUEUE_COUNT"
          style={{ color: colors.text }}
        >
          {countLabel}
        </Text>
        <Group gap={6}>
          <ActionIcon
            aria-label="Clear queued comments"
            data-testid="COMMENT_CLEAR_BUTTON"
            variant="subtle"
            size="sm"
            disabled={sending}
            onClick={() => {
              // Belt-and-suspenders: the disabled attribute already blocks the click while
              // sending, this guard just makes the invariant explicit at the call site.
              if (sending) return;
              clearQueue();
            }}
          >
            <IconTrash size={ICON_SIZE} />
          </ActionIcon>
          <ActionIcon
            aria-label="Send queued comments"
            data-testid="COMMENT_SEND_BUTTON"
            variant="subtle"
            size="sm"
            disabled={sending}
            onClick={() => {
              if (sending) return;
              setSending(true);
              questCommentBatchBroker({ questId, comments: entries })
                .then((result) => {
                  if (result.outcome === 'sent') {
                    // The badges refresh from the server's quest broadcast — nothing else to do
                    // here beyond releasing the local queue.
                    clearQueue();
                    return;
                  }
                  if (result.outcome === 'stale') {
                    // Prune exactly the anchors the server named; every other comment stays
                    // queued so a second Send can succeed without losing unrelated work.
                    result.staleAnchors.forEach((anchor) => {
                      deleteComment({ anchor });
                    });
                    mantineNotificationsShowAdapter({
                      message: staleAnchorNoticeTransformer({
                        staleAnchors: result.staleAnchors,
                      }),
                      color: 'red',
                    });
                    return;
                  }
                  // outcome === 'failed' — the whole queue stays intact for a retry.
                  mantineNotificationsShowAdapter({ message: result.error, color: 'red' });
                })
                .catch((error: unknown) => {
                  // The fetch itself rejected before any response arrived — the queue is left
                  // untouched (cleared only on a 200) and the failure is logged for diagnosis.
                  globalThis.console.error('[comment-queue-bar] send failed', error);
                  mantineNotificationsShowAdapter({ message: NETWORK_ERROR_MESSAGE, color: 'red' });
                })
                .finally(() => {
                  setSending(false);
                });
            }}
          >
            <IconSend size={ICON_SIZE} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
};

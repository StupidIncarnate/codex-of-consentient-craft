/**
 * PURPOSE: Renders the comment icon button on a flow-diagram box and the popover behind it — a
 * two-row auto-growing textarea where Enter queues and Shift+Enter inserts a newline, and, once a
 * comment is queued for that box, a read-back view with edit and delete buttons.
 *
 * USAGE:
 * <CommentPopoverWidget questId={questId} flowId={flow.id} nodeId={node.id} />
 * // Node-card comment. Pass observableId as well to anchor the comment to an assertion card.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ActionIcon, Group, Popover, Stack, Text } from '@mantine/core';
import { IconMessageCircle, IconPencil, IconTrash, IconX } from '@tabler/icons-react';

import type { FlowId, FlowNodeId, ObservableId, QuestId } from '@dungeonmaster/shared/contracts';
import { commentTextContract } from '@dungeonmaster/shared/contracts';

import { useCommentQueueBinding } from '../../bindings/use-comment-queue/use-comment-queue-binding';
import { commentAnchorContract } from '../../contracts/comment-anchor/comment-anchor-contract';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const { colors } = emberDepthsThemeStatics;
const ICON_SIZE = 12;
const DROPDOWN_WIDTH = 260;

export interface CommentPopoverWidgetProps {
  questId: QuestId;
  flowId: FlowId;
  nodeId: FlowNodeId;
  observableId?: ObservableId;
}

export const CommentPopoverWidget = ({
  questId,
  flowId,
  nodeId,
  observableId,
}: CommentPopoverWidgetProps): React.JSX.Element => {
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const anchor = useMemo(
    () =>
      commentAnchorContract.parse({
        flowId,
        nodeId,
        ...(observableId === undefined ? {} : { observableId }),
      }),
    [flowId, nodeId, observableId],
  );

  const { entryFor, queueComment, deleteComment } = useCommentQueueBinding({ questId });
  const queued = entryFor({ anchor });
  const showEditor = editing || queued === undefined;

  useEffect(() => {
    const element = textareaRef.current;
    if (element === null) return;
    // Reset before measuring so the box shrinks back when text is deleted. The line-count floor is
    // what grows the box for hard newlines; scrollHeight covers text that soft-wraps past the edge.
    element.style.height = 'auto';
    const lineCount = Math.max(commentQueueStatics.editor.rows, draft.split('\n').length);
    const minHeight =
      lineCount * commentQueueStatics.editor.lineHeightPx +
      commentQueueStatics.editor.verticalChromePx;
    element.style.height = `${String(Math.max(minHeight, element.scrollHeight))}px`;
  }, [draft, showEditor, opened]);

  const submitDraft = useCallback((): void => {
    const trimmed = draft.trim();
    // Whitespace-only queues nothing and leaves the editor open — there is no comment to store and
    // closing would silently discard what the user is still typing.
    if (trimmed.length === 0) return;
    queueComment({ anchor, text: commentTextContract.parse(trimmed) });
    setEditing(false);
  }, [draft, queueComment, anchor]);

  const openForBox = useCallback((): void => {
    const existing = entryFor({ anchor });
    setDraft(existing === undefined ? '' : String(existing.text));
    setEditing(existing === undefined);
    setOpened(true);
  }, [entryFor, anchor]);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      withArrow
      withinPortal
      transitionProps={{ duration: 0 }}
    >
      <Popover.Target>
        <ActionIcon
          component="span"
          role="button"
          aria-label="Comment on this box"
          data-testid="COMMENT_BUTTON"
          // nodrag/nopan are React Flow's opt-out classes: without them a mousedown on this button
          // starts a node drag / canvas pan instead of registering as a click.
          className="nodrag nopan"
          variant="subtle"
          size="sm"
          onClick={(event) => {
            // The card's own click handler selects the node and opens the detail panel, which would
            // cover the popover this same click just opened.
            event.stopPropagation();
            if (opened) {
              setOpened(false);
              return;
            }
            openForBox();
          }}
        >
          <IconMessageCircle size={ICON_SIZE} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown
        data-testid="COMMENT_POPOVER"
        className="nodrag nopan"
        style={{
          background: colors['bg-raised'],
          borderColor: colors.border,
          width: DROPDOWN_WIDTH,
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {showEditor ? (
          <Stack gap={8}>
            <textarea
              ref={textareaRef}
              data-testid="COMMENT_TEXTAREA"
              value={draft}
              rows={commentQueueStatics.editor.rows}
              placeholder="Leave a comment..."
              onChange={(event) => {
                setDraft(event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                // Shift+Enter falls through to the textarea's own newline handling, matching the
                // convention ChatInputWidget already uses everywhere text is composed in this UI.
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitDraft();
                }
              }}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: `${String(commentQueueStatics.editor.lineHeightPx)}px`,
                color: colors.text,
                backgroundColor: colors['bg-deep'],
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
                padding: 6,
                resize: 'none',
                overflow: 'hidden',
                outline: 'none',
              }}
            />
            <Group gap={6} justify="flex-end">
              <ActionIcon
                aria-label="Queue comment"
                data-testid="COMMENT_QUEUE_BUTTON"
                variant="subtle"
                size="sm"
                onClick={() => {
                  submitDraft();
                }}
              >
                <IconMessageCircle size={ICON_SIZE} />
              </ActionIcon>
              <ActionIcon
                aria-label="Cancel comment"
                data-testid="COMMENT_CANCEL_BUTTON"
                variant="subtle"
                size="sm"
                onClick={() => {
                  // Cancel abandons this edit session without touching the queue: it restores the
                  // prior queued view when there was one, and otherwise just closes.
                  if (queued === undefined) {
                    setOpened(false);
                    return;
                  }
                  setDraft(String(queued.text));
                  setEditing(false);
                }}
              >
                <IconX size={ICON_SIZE} />
              </ActionIcon>
            </Group>
          </Stack>
        ) : (
          <Stack gap={8}>
            <Text
              ff="monospace"
              size="xs"
              data-testid="COMMENT_QUEUED_TEXT"
              // pre-wrap keeps the author's newlines; break-word is what stops a token with no
              // break opportunity (a long camelCase symbol, a base64 blob, a hash) from painting
              // past the dropdown's fixed width and clipping the rest of the note. Comment text is
              // free-form user input, so it needs the same guard the node label and the assertion
              // description already carry.
              style={{ color: colors.text, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
            >
              {queued.text}
            </Text>
            <Group gap={6} justify="flex-end">
              <ActionIcon
                aria-label="Edit queued comment"
                data-testid="COMMENT_EDIT_BUTTON"
                variant="subtle"
                size="sm"
                onClick={() => {
                  setDraft(String(queued.text));
                  setEditing(true);
                }}
              >
                <IconPencil size={ICON_SIZE} />
              </ActionIcon>
              <ActionIcon
                aria-label="Delete queued comment"
                data-testid="COMMENT_DELETE_BUTTON"
                variant="subtle"
                color={colors.danger}
                size="sm"
                onClick={() => {
                  deleteComment({ anchor });
                  setOpened(false);
                }}
              >
                <IconTrash size={ICON_SIZE} />
              </ActionIcon>
            </Group>
          </Stack>
        )}
      </Popover.Dropdown>
    </Popover>
  );
};

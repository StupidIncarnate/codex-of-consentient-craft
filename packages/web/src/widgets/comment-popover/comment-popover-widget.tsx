/**
 * PURPOSE: The one comment affordance every commentable diagram box mounts — flow-node cards and
 * assertion cards alike — so the bubble's fill rule, its alignment and its editor land once rather
 * than per host. The bubble is a queue indicator, not a history marker: it fills for work the author
 * still owes a SEND, which is why it reads from the live queue store on every render instead of
 * holding fill state of its own.
 *
 * USAGE:
 * <CommentPopoverWidget questId={questId} flowId={flow.id} nodeId={node.id} />
 * // Node-card comment. Pass observableId as well to anchor the comment to an assertion card.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Group, Popover, Stack, Text } from '@mantine/core';
import {
  IconMessageCircle,
  IconMessageCircleFilled,
  IconPencil,
  IconTrash,
  IconX,
} from '@tabler/icons-react';

import type { FlowId, FlowNodeId, ObservableId, QuestId } from '@dungeonmaster/shared/contracts';
import { commentTextContract } from '@dungeonmaster/shared/contracts';

import { useCommentQueueBinding } from '../../bindings/use-comment-queue/use-comment-queue-binding';
import { buttonLabelContract } from '../../contracts/button-label/button-label-contract';
import { buttonVariantContract } from '../../contracts/button-variant/button-variant-contract';
import { commentAnchorContract } from '../../contracts/comment-anchor/comment-anchor-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { IconButtonWidget } from '../icon-button/icon-button-widget';

const { colors } = emberDepthsThemeStatics;
const DROPDOWN_WIDTH = 260;
const PRIMARY_VARIANT = buttonVariantContract.parse('primary');
const DANGER_VARIANT = buttonVariantContract.parse('danger');
const BUBBLE_LABEL = buttonLabelContract.parse('Comment on this box');
const BUBBLE_TEST_ID = testIdContract.parse('COMMENT_BUTTON');
const BUBBLE_ROW_TEST_ID = testIdContract.parse('COMMENT_BUTTON_ROW');
const QUEUE_LABEL = buttonLabelContract.parse('Queue comment');
const QUEUE_TEST_ID = testIdContract.parse('COMMENT_QUEUE_BUTTON');
const CANCEL_LABEL = buttonLabelContract.parse('Cancel comment');
const CANCEL_TEST_ID = testIdContract.parse('COMMENT_CANCEL_BUTTON');
const EDIT_LABEL = buttonLabelContract.parse('Edit queued comment');
const EDIT_TEST_ID = testIdContract.parse('COMMENT_EDIT_BUTTON');
const DELETE_LABEL = buttonLabelContract.parse('Delete queued comment');
const DELETE_TEST_ID = testIdContract.parse('COMMENT_DELETE_BUTTON');

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
      {/* The bubble is the last thing in the card's flow, so without this row it inherits the
          card's left alignment. Right-aligning it gives every box one predictable corner to scan
          for comment state, which is the whole point of making the fill visible. */}
      <div data-testid={BUBBLE_ROW_TEST_ID} style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Popover.Target>
          <IconButtonWidget
            label={BUBBLE_LABEL}
            testId={BUBBLE_TEST_ID}
            // Filled means "this box is under edit, or owes a SEND". Both conditions are read
            // live — `queued` comes from the shared queue store, so queueing on this box fills it
            // and a delete or a queue flush anywhere empties it again, with no reload.
            icon={opened || queued !== undefined ? IconMessageCircleFilled : IconMessageCircle}
            // nodrag/nopan are React Flow's opt-out classes: without them a mousedown on this
            // button starts a node drag / canvas pan instead of registering as a click.
            className="nodrag nopan"
            onClick={(event) => {
              // The card's own click handler selects the node and opens the detail panel, which
              // would cover the popover this same click just opened.
              event.stopPropagation();
              if (opened) {
                setOpened(false);
                return;
              }
              openForBox();
            }}
          />
        </Popover.Target>
      </div>
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
              <IconButtonWidget
                label={QUEUE_LABEL}
                testId={QUEUE_TEST_ID}
                icon={IconMessageCircle}
                variant={PRIMARY_VARIANT}
                onClick={() => {
                  submitDraft();
                }}
              />
              <IconButtonWidget
                label={CANCEL_LABEL}
                testId={CANCEL_TEST_ID}
                icon={IconX}
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
              />
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
              <IconButtonWidget
                label={EDIT_LABEL}
                testId={EDIT_TEST_ID}
                icon={IconPencil}
                onClick={() => {
                  setDraft(String(queued.text));
                  setEditing(true);
                }}
              />
              <IconButtonWidget
                label={DELETE_LABEL}
                testId={DELETE_TEST_ID}
                icon={IconTrash}
                variant={DANGER_VARIANT}
                onClick={() => {
                  deleteComment({ anchor });
                  setOpened(false);
                }}
              />
            </Group>
          </Stack>
        )}
      </Popover.Dropdown>
    </Popover>
  );
};

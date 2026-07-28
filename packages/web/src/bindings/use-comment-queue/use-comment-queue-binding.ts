/**
 * PURPOSE: React hook exposing one quest's queued comments plus the mutations a comment popover
 * needs. Every consumer subscribes to the same shared store, so queueing from one flow-diagram
 * card re-renders every other card and the queue bar together.
 *
 * USAGE:
 * const { entries, entryFor, queueComment, deleteComment, clearQueue } = useCommentQueueBinding({ questId });
 * // entryFor({ anchor }) returns the queued comment for one box, or undefined
 * // queueComment({ anchor, text }) stamps a fresh createdAt and replaces any entry on that box
 */

import { useCallback, useEffect, useState } from 'react';

import type { CommentText, QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentAnchor } from '../../contracts/comment-anchor/comment-anchor-contract';
import { commentQueueEntryContract } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { isSameCommentAnchorGuard } from '../../guards/is-same-comment-anchor/is-same-comment-anchor-guard';
import { commentQueueState } from '../../state/comment-queue/comment-queue-state';

export const useCommentQueueBinding = ({
  questId,
}: {
  questId: QuestId;
}): {
  entries: CommentQueueEntry[];
  entryFor: (params: { anchor: CommentAnchor }) => CommentQueueEntry | undefined;
  queueComment: (params: { anchor: CommentAnchor; text: CommentText }) => void;
  deleteComment: (params: { anchor: CommentAnchor }) => void;
  clearQueue: () => void;
} => {
  const [entries, setEntries] = useState<CommentQueueEntry[]>(() =>
    commentQueueState.read({ questId }),
  );

  useEffect(() => {
    // Re-read on questId change as well as on notify: navigating from quest A to quest B keeps
    // this hook mounted, so without the immediate read the previous quest's queue would linger.
    setEntries(commentQueueState.read({ questId }));
    return commentQueueState.subscribe({
      questId,
      listener: (): void => {
        setEntries(commentQueueState.read({ questId }));
      },
    });
  }, [questId]);

  const entryFor = useCallback(
    ({ anchor }: { anchor: CommentAnchor }): CommentQueueEntry | undefined =>
      entries.find((entry) => isSameCommentAnchorGuard({ left: entry, right: anchor })),
    [entries],
  );

  const queueComment = useCallback(
    ({ anchor, text }: { anchor: CommentAnchor; text: CommentText }): void => {
      // A fresh createdAt on every queue is what keeps an actively edited comment out of reach of
      // the 7 day sweep — createdAt is the age of the text as it stands, not of the first draft.
      commentQueueState.queue({
        questId,
        entry: commentQueueEntryContract.parse({
          ...anchor,
          text,
          createdAt: new Date().toISOString(),
        }),
      });
    },
    [questId],
  );

  const deleteComment = useCallback(
    ({ anchor }: { anchor: CommentAnchor }): void => {
      commentQueueState.remove({ questId, anchor });
    },
    [questId],
  );

  const clearQueue = useCallback((): void => {
    commentQueueState.clearQueue({ questId });
  }, [questId]);

  return { entries, entryFor, queueComment, deleteComment, clearQueue };
};

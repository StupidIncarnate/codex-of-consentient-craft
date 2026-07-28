/**
 * PURPOSE: Builds the one-line toast text naming every queued comment dropped because its anchor no
 * longer resolves on the quest. The box that vanished can no longer supply a label, so each dropped
 * comment is named by its flowId / nodeId (/ observableId) path instead — the only stable identity
 * left once the box itself is gone.
 *
 * USAGE:
 * staleAnchorNoticeTransformer({ staleAnchors: [{ flowId: 'login-flow', nodeId: 'start' }] });
 * // Returns 'Dropped 1 queued comment — its box no longer exists on the quest: login-flow / start'
 */

import type { CommentAnchor } from '../../contracts/comment-anchor/comment-anchor-contract';
import { notificationMessageContract } from '../../contracts/notification-message/notification-message-contract';
import type { NotificationMessage } from '../../contracts/notification-message/notification-message-contract';

export const staleAnchorNoticeTransformer = ({
  staleAnchors,
}: {
  staleAnchors: readonly CommentAnchor[];
}): NotificationMessage => {
  const count = staleAnchors.length;
  const isSingular = count === 1;
  const commentWord = isSingular ? 'comment' : 'comments';
  const boxWord = isSingular ? 'its box' : 'their boxes';
  const existWord = isSingular ? 'no longer exists' : 'no longer exist';
  const labels = staleAnchors
    .map((anchor) =>
      anchor.observableId === undefined
        ? `${anchor.flowId} / ${anchor.nodeId}`
        : `${anchor.flowId} / ${anchor.nodeId} / ${anchor.observableId}`,
    )
    .join(', ');

  return notificationMessageContract.parse(
    `Dropped ${String(count)} queued ${commentWord} — ${boxWord} ${existWord} on the quest: ${labels}`,
  );
};

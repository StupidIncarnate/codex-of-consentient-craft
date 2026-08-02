import type { StubArgument } from '@dungeonmaster/shared/@types';

import { qaChecklistItemContract } from './qa-checklist-item-contract';
import type { QaChecklistItem } from './qa-checklist-item-contract';

export const QaChecklistItemStub = ({
  ...props
}: StubArgument<QaChecklistItem> = {}): QaChecklistItem =>
  qaChecklistItemContract.parse({
    id: 'view-persisted-comments:observable:check-badge-count-text',
    flowId: 'view-persisted-comments',
    kind: 'observable',
    nodeId: 'render-comment-badge',
    observableId: 'check-badge-count-text',
    observableType: 'ui-state',
    label: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
    checkSurface: 'the rendered DOM in a real, attached, VISIBLE browser tab',
    ...props,
  });

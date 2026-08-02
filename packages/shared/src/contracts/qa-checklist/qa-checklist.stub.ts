import type { StubArgument } from '@dungeonmaster/shared/@types';

import { QaChecklistItemStub } from '../qa-checklist-item/qa-checklist-item.stub';
import { QaWalkPathStub } from '../qa-walk-path/qa-walk-path.stub';
import { qaChecklistContract } from './qa-checklist-contract';
import type { QaChecklist } from './qa-checklist-contract';

export const QaChecklistStub = ({ ...props }: StubArgument<QaChecklist> = {}): QaChecklist =>
  qaChecklistContract.parse({
    flowId: 'view-persisted-comments',
    flowName: 'View Persisted Comments on a Quest',
    entryPoint: '/:guildSlug/quest/:questId',
    paths: [QaWalkPathStub({ nodeIds: ['quest-spec-panel-loaded', 'no-comment-badge'] })],
    pathsTruncated: false,
    items: [QaChecklistItemStub()],
    remainingItemIds: ['view-persisted-comments:observable:check-badge-count-text'],
    ...props,
  });

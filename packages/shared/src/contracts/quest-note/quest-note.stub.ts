import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questNoteContract } from './quest-note-contract';
import type { QuestNote } from './quest-note-contract';

export const QuestNoteStub = ({ ...props }: StubArgument<QuestNote> = {}): QuestNote =>
  questNoteContract.parse({
    id: 'open-question-comment-anchor-scope',
    kind: 'open-question',
    role: 'siegemaster',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    flowId: 'view-persisted-comments',
    unitId: 'view-persisted-comments:observable:check-badge-count-text',
    summary: 'Should a stale anchor notify per box or once per batch?',
    detail:
      'The batch send drops boxes whose node id no longer exists in the flow. Asked the operator; no answer landed before the walk ended.',
    at: '2026-01-01T00:00:00.000Z',
    ...props,
  });

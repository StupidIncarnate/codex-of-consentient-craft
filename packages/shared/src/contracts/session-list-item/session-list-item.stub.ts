import type { StubArgument } from '@dungeonmaster/shared/@types';

import { sessionListItemContract } from './session-list-item-contract';
import type { SessionListItem } from './session-list-item-contract';

export const SessionListItemStub = ({
  ...props
}: StubArgument<SessionListItem> = {}): SessionListItem =>
  sessionListItemContract.parse({
    sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    startedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

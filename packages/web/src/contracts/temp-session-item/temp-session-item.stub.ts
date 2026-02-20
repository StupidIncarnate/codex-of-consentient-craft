import type { StubArgument } from '@dungeonmaster/shared/@types';

import { tempSessionItemContract } from './temp-session-item-contract';
import type { TempSessionItem } from './temp-session-item-contract';

export const TempSessionItemStub = ({
  ...props
}: StubArgument<TempSessionItem> = {}): TempSessionItem =>
  tempSessionItemContract.parse({
    sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    title: 'Fix auth bug',
    startedAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

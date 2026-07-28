import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questCommentContract } from './quest-comment-contract';
import type { QuestComment } from './quest-comment-contract';

export const QuestCommentStub = ({ ...props }: StubArgument<QuestComment> = {}): QuestComment =>
  questCommentContract.parse({
    id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479',
    flowId: 'login-flow',
    nodeId: 'start',
    text: 'This assertion looks wrong',
    createdAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });

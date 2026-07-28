import { questCommentIdContract } from './quest-comment-id-contract';
import type { QuestCommentId } from './quest-comment-id-contract';

export const QuestCommentIdStub = (
  { value }: { value: string } = { value: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479' },
): QuestCommentId => questCommentIdContract.parse(value);

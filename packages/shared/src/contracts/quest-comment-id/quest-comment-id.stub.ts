import type { QuestComment } from '../quest-comment/quest-comment-contract';
import { questCommentContract } from '../quest-comment/quest-comment-contract';

export const QuestCommentIdStub = (
  { value }: { value: string } = { value: 'c0e3e17a-58cc-4372-a567-0e02b2c3d479' },
): QuestComment['id'] => questCommentContract.shape.id.parse(value);

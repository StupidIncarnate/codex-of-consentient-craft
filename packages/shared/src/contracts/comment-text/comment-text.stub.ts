import { commentTextContract } from './comment-text-contract';
import type { CommentText } from './comment-text-contract';

export const CommentTextStub = (
  { value }: { value: string } = { value: 'This assertion looks wrong' },
): CommentText => commentTextContract.parse(value);

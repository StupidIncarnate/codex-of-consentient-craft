import { commentCountContract } from './comment-count-contract';
import type { CommentCount } from './comment-count-contract';

export const CommentCountStub = ({ value }: { value?: number } = {}): CommentCount =>
  commentCountContract.parse(value ?? 0);

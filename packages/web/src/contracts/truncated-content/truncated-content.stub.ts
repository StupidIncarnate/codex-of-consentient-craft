import type { StubArgument } from '@dungeonmaster/shared/@types';

import { truncatedContentContract } from './truncated-content-contract';
import type { TruncatedContent } from './truncated-content-contract';

export const TruncatedContentStub = ({
  value = 'truncated content',
}: StubArgument<{ value: string }> = {}): TruncatedContent => truncatedContentContract.parse(value);

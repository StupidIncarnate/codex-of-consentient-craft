import type { StubArgument } from '@dungeonmaster/shared/@types';

import { tokenAnnotationContract } from './token-annotation-contract';
import type { TokenAnnotation } from './token-annotation-contract';

export const TokenAnnotationStub = ({
  ...props
}: StubArgument<TokenAnnotation> = {}): TokenAnnotation =>
  tokenAnnotationContract.parse({
    tokenBadgeLabel: null,
    resultTokenBadgeLabel: null,
    cumulativeContext: null,
    contextDelta: null,
    source: 'session',
    ...props,
  });

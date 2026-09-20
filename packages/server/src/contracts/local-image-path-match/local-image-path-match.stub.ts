import type { StubArgument } from '@dungeonmaster/shared/@types';

import { localImagePathMatchContract } from './local-image-path-match-contract';
import type { LocalImagePathMatch } from './local-image-path-match-contract';

export const LocalImagePathMatchStub = ({
  ...props
}: StubArgument<LocalImagePathMatch> = {}): LocalImagePathMatch =>
  localImagePathMatchContract.parse({
    path: '/home/user/pasted.png',
    // Defaults to the path itself: an unquoted, unescaped path is the common case, and it is the
    // one where the two fields agree. A caller exercising the quoted or escaped forms passes both.
    matchedText: props.path ?? '/home/user/pasted.png',
    ordinal: 1,
    ...props,
  });

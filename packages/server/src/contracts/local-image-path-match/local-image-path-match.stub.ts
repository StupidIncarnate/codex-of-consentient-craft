import type { StubArgument } from '@dungeonmaster/shared/@types';

import { localImagePathMatchContract } from './local-image-path-match-contract';
import type { LocalImagePathMatch } from './local-image-path-match-contract';

export const LocalImagePathMatchStub = ({
  ...props
}: StubArgument<LocalImagePathMatch> = {}): LocalImagePathMatch =>
  localImagePathMatchContract.parse({
    path: '/home/user/pasted.png',
    ordinal: 1,
    ...props,
  });

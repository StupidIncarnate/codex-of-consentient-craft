import type { StubArgument } from '@dungeonmaster/shared/@types';

import { videoResultContract } from './video-result-contract';
import type { VideoResult } from './video-result-contract';

export const VideoResultStub = ({ ...props }: StubArgument<VideoResult> = {}): VideoResult =>
  videoResultContract.parse({
    status: 'started',
    path: null,
    ...props,
  });

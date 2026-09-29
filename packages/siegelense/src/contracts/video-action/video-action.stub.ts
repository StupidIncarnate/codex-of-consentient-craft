import type { z } from '#gateway/npm/zod';

import { videoActionContract } from './video-action-contract';
import type { VideoAction } from './video-action-contract';

type VideoActionInput = z.input<typeof videoActionContract>;

export const VideoActionStub = ({ value }: { value?: VideoActionInput } = {}): VideoAction =>
  videoActionContract.parse(value ?? 'start');

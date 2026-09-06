import type { StubArgument } from '@dungeonmaster/shared/@types';

import { uploadProgressPostContract } from './upload-progress-post-contract';
import type { UploadProgressPost } from './upload-progress-post-contract';

export const UploadProgressPostStub = ({
  ...props
}: StubArgument<UploadProgressPost> = {}): UploadProgressPost =>
  uploadProgressPostContract.parse({
    url: '/api/quests/f47ac10b-58cc-4372-a567-0e02b2c3d479/messages',
    body: { text: 'hello' },
    onProgress: (): void => undefined,
    ...props,
  });

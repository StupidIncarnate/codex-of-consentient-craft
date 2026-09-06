import type { StubArgument } from '@dungeonmaster/shared/@types';

import { composerSerializedContract } from './composer-serialized-contract';
import type { ComposerSerialized } from './composer-serialized-contract';

export const ComposerSerializedStub = ({
  ...props
}: StubArgument<ComposerSerialized> = {}): ComposerSerialized =>
  composerSerializedContract.parse({
    text: 'A[Pasted Image 1]B',
    attachmentIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
    ...props,
  });

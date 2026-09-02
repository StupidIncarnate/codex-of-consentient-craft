import type { StubArgument } from '@dungeonmaster/shared/@types';

import { pastedImageDraftContract } from './pasted-image-draft-contract';
import type { PastedImageDraft } from './pasted-image-draft-contract';

export const PastedImageDraftStub = ({
  ...props
}: StubArgument<PastedImageDraft> = {}): PastedImageDraft =>
  pastedImageDraftContract.parse({
    attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    mediaType: 'image/png',
    dataBase64: 'iVBORw0KGgo=',
    ...props,
  });

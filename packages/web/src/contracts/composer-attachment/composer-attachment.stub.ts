import type { StubArgument } from '@dungeonmaster/shared/@types';

import { composerAttachmentContract } from './composer-attachment-contract';
import type { ComposerAttachment } from './composer-attachment-contract';

export const ComposerAttachmentStub = ({
  ...props
}: StubArgument<ComposerAttachment> = {}): ComposerAttachment =>
  composerAttachmentContract.parse({
    attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    mediaType: 'image/png',
    dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    byteLength: 1024,
    widthPx: 2000,
    heightPx: 1333,
    ...props,
  });

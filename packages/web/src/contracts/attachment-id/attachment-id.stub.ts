import type { ComposerAttachment } from '../composer-attachment/composer-attachment-contract';
import { composerAttachmentContract } from '../composer-attachment/composer-attachment-contract';
import { ComposerAttachmentStub } from '../composer-attachment/composer-attachment.stub';

export const AttachmentIdStub = ({
  value,
}: { value?: string } = {}): ComposerAttachment['attachmentId'] => {
  const attachment = composerAttachmentContract.parse({
    ...ComposerAttachmentStub(),
    attachmentId: value ?? 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  });
  return attachment.attachmentId;
};

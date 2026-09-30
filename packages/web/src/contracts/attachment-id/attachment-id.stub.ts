import type { ComposerAttachment } from '../composer-attachment/composer-attachment-contract';
import { composerAttachmentContract } from '../composer-attachment/composer-attachment-contract';

export const AttachmentIdStub = ({ value }: { value?: string } = {}): ComposerAttachment['attachmentId'] =>
  composerAttachmentContract.shape.attachmentId.parse(value ?? 'f47ac10b-58cc-4372-a567-0e02b2c3d479');

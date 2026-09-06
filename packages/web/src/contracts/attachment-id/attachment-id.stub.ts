import { attachmentIdContract } from './attachment-id-contract';
import type { AttachmentId } from './attachment-id-contract';

export const AttachmentIdStub = ({ value }: { value?: string } = {}): AttachmentId =>
  attachmentIdContract.parse(value ?? 'f47ac10b-58cc-4372-a567-0e02b2c3d479');

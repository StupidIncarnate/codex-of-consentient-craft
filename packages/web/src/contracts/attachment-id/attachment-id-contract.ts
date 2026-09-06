/**
 * PURPOSE: This id never leaves the browser. It ties a thumbnail element in the chat composer to
 * its bytes and to its IndexedDB draft record. Reach for this rather than any server-side image
 * id — the server names its own files and never sees this value.
 *
 * USAGE:
 * attachmentIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: AttachmentId branded string
 */

import { z } from 'zod';

export const attachmentIdContract = z.string().uuid().brand<'AttachmentId'>();

export type AttachmentId = z.infer<typeof attachmentIdContract>;

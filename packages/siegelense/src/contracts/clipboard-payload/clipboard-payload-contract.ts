/**
 * PURPOSE: What one `paste` step writes to the page's clipboard before pressing `ControlOrMeta+V`:
 * either literal text, or a file's bytes as base64 with the mime type its extension names. Reach
 * for this over the step's own `value`/`filePath` pair: that pair can carry both or neither, while a
 * payload is the one thing that actually reaches the clipboard.
 *
 * USAGE:
 * clipboardPayloadContract.parse({ kind: 'file', base64: 'iVBORw==', mimeType: 'image/png' });
 * // Returns the parsed file payload
 */

import { z } from '#gateway/npm/zod';

export const clipboardPayloadContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    text: z.string().brand<'ClipboardText'>(),
  }),
  z.object({
    kind: z.literal('file'),
    base64: z.string().brand<'ClipboardBase64'>(),
    mimeType: z.string().min(1).brand<'MimeType'>(),
  }),
]);

export type ClipboardPayload = z.infer<typeof clipboardPayloadContract>;

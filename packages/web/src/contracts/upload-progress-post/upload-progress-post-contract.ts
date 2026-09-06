/**
 * PURPOSE: Carries the extra progress-reporting hook a browser-native XHR upload can offer that
 * `fetch` cannot. Reach for this over fetchPostWithStatusResultContract when the caller needs
 * bytes-sent/bytes-total ticks while the request is still in flight, not just the settled result.
 *
 * USAGE:
 * uploadProgressPostContract.parse({
 *   url: '/api/quests/abc/messages',
 *   body: { text: 'hello' },
 *   onProgress: ({ bytesSent, bytesTotal }) => {},
 * });
 * // Returns: UploadProgressPost
 */

import { z } from 'zod';

import type { ByteLength } from '../byte-length/byte-length-contract';

export type UploadProgressHandler = (params: {
  bytesSent: ByteLength;
  bytesTotal: ByteLength;
}) => void;

export const uploadProgressPostContract = z.object({
  url: z.string().min(1).brand<'RequestUrl'>(),
  body: z.unknown(),
  onProgress: z.custom<UploadProgressHandler>((value) => typeof value === 'function'),
});

export type UploadProgressPost = z.infer<typeof uploadProgressPostContract>;

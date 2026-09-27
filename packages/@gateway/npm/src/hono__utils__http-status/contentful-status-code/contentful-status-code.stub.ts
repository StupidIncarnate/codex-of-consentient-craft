/**
 * PURPOSE: A real `ContentfulStatusCode` value. This subpath is type-only (`export type * from
 * 'hono/utils/http-status'`), so there is no runtime constructor to call; 200 is the one status
 * every content-bearing HTTP response actually uses, typed against the real union rather than a
 * bare `number`.
 *
 * USAGE:
 * const status = ContentfulStatusCodeStub();
 * // Returns 200, typed as a real ContentfulStatusCode
 */
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const ContentfulStatusCodeStub = (): ContentfulStatusCode => 200;

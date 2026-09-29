/**
 * PURPOSE: Names what `JSON.parse` can produce from an HTTP response body — any JSON value — so
 * dmHttpRequestBroker parses the text straight into a contract and a text that is not JSON throws
 * there. The shape stays open by design: the calling route's own contract narrows it further.
 *
 * USAGE:
 * dmResponseBodyContract.parse(JSON.parse(response.body));
 * // Returns the JSON value, never `undefined` or a function
 */
import { z } from '#gateway/npm/zod';

export type DmResponseBody =
  boolean | number | string | null | DmResponseBody[] | { [key: string]: DmResponseBody };

export const dmResponseBodyContract: z.ZodType<DmResponseBody> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.number(),
    z.string(),
    z.null(),
    z.array(dmResponseBodyContract),
    z.record(z.string(), dmResponseBodyContract),
  ]),
);

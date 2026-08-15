/**
 * PURPOSE: Validates the riftcarver result detail response. Reach for this over wardDetailContract
 * when parsing the riftcarver-results HTTP response: the persisted artifact is one plain-text carve
 * log rather than ward's structured per-check/per-project breakdown, so the whole payload is a single
 * string field wrapped in a JSON envelope.
 *
 * USAGE:
 * const parsed = riftcarverDetailContract.safeParse(detail);
 * if (parsed.success) riftcarverLogToDisplayLinesTransformer({ detail: parsed.data });
 * // parsed.data.log is the full carve log as one string.
 */

import { z } from 'zod';

export const riftcarverDetailContract = z.object({
  log: z.string().brand<'RiftcarverLog'>(),
});

export type RiftcarverDetail = z.infer<typeof riftcarverDetailContract>;

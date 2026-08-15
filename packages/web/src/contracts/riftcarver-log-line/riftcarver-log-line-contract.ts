/**
 * PURPOSE: Branded string for a single line of a riftcarver carve log, rendered under an expanded
 * [RIFTCARVER] execution row. Unlike wardDetailLineContract, a blank line is a valid value — the raw
 * log's own blank lines (banner spacing between the git/node_modules/build steps) are preserved rather
 * than filtered.
 *
 * USAGE:
 * const line = riftcarverLogLineContract.parse('— build pass 1 —');
 * // Returns: RiftcarverLogLine branded string
 */

import { z } from 'zod';

export const riftcarverLogLineContract = z.string().brand<'RiftcarverLogLine'>();

export type RiftcarverLogLine = z.infer<typeof riftcarverLogLineContract>;

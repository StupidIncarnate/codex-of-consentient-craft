/**
 * PURPOSE: Defines a branded ISO timestamp string type. The web mints its own fresh "now" for the
 * live elapsed figure on an in-progress work-item row, and `@dungeonmaster/shared` exports no
 * timestamp contract to parse that value through — reach for this over a raw string or a cast so
 * the minted value stays assignable to `WorkItem['startedAt']`, which shared brands inline with the
 * same 'IsoTimestamp' tag.
 *
 * USAGE:
 * const timestamp: IsoTimestamp = isoTimestampContract.parse('2024-01-15T10:00:00.000Z');
 * // Returns a branded IsoTimestamp string
 */

import { z } from 'zod';

export const isoTimestampContract = z.string().datetime().brand<'IsoTimestamp'>();

export type IsoTimestamp = z.infer<typeof isoTimestampContract>;

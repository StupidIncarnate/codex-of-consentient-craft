/**
 * PURPOSE: The reading returned by the `dom` step — carrying `count` (total matching elements),
 * optional `showing` (number of elements returned), optional `capped` (whether count > showing),
 * optional `note` (the warning note when capped), and optional `nodes` (the list of DomNode readings).
 * Supports pure count queries ({ step: 'dom', target: '...', fields: ['count'] }) as well as
 * projected or full node listings.
 *
 * USAGE:
 * domReadingContract.parse({ count: 12, showing: 10, capped: true, note: '...', nodes: [...] });
 * // Returns a validated DomReading
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { domNodeContract } from '../dom-node/dom-node-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const domReadingContract = z
  .object({
    count: readingCountContract,
    showing: readingCountContract.optional(),
    capped: z.boolean().optional(),
    note: contentTextContract.nullable().optional(),
    nodes: z.array(domNodeContract).readonly().optional(),
  })
  .strict();

export type DomReading = z.infer<typeof domReadingContract>;

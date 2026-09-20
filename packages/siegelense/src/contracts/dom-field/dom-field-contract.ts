/**
 * PURPOSE: The field names a caller can request in a `dom` step's `fields: [...]` projection
 * (siegelense-tooling.md lines 654, 658-659). Limits the node reading to the requested fields
 * or requests a pure match count without node serialization when 'count' alone is requested.
 *
 * USAGE:
 * domFieldContract.parse('text');
 * // Returns 'text' as a validated DomField
 */

import { z } from 'zod';

import { domStatics } from '../../statics/dom/dom-statics';

export const domFieldContract = z.enum(domStatics.fields.all);

export type DomField = z.infer<typeof domFieldContract>;

/**
 * PURPOSE: One DOM node reading returned by the `dom` step — carrying the raw properties of the element
 * (tag, testId, class, children, computed display/visibility/opacity, bounding rect, text, attrs, and value)
 * or a projected subset of them when `fields:` is specified.
 *
 * USAGE:
 * domNodeContract.parse({ tagName: 'button', text: 'Click me' });
 * // Returns a validated DomNode
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { attrPairContract } from '../attr-pair/attr-pair-contract';
import { domRectContract } from '../dom-rect/dom-rect-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const domNodeContract = z
  .object({
    tagName: contentTextContract.optional(),
    testId: contentTextContract.nullable().optional(),
    className: contentTextContract.nullable().optional(),
    childCount: readingCountContract.optional(),
    display: contentTextContract.optional(),
    visibility: contentTextContract.optional(),
    opacity: contentTextContract.optional(),
    rect: domRectContract.optional(),
    text: contentTextContract.optional(),
    attrs: z.array(attrPairContract).readonly().optional(),
    value: contentTextContract.nullable().optional(),
  })
  .strict();

export type DomNode = z.infer<typeof domNodeContract>;

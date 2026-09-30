/**
 * PURPOSE: One DOM node reading returned by the `dom` step — carrying the raw properties of the element
 * (tag, testId, class, children, computed display/visibility/opacity, bounding rect, text, attrs, and value)
 * or a projected subset of them when `fields:` is specified.
 *
 * USAGE:
 * domNodeContract.parse({ tagName: 'button', text: 'Click me' });
 * // Returns a validated DomNode
 */

import { z } from '#gateway/npm/zod';


import { attrPairContract } from '../attr-pair/attr-pair-contract';
import { domRectContract } from '../dom-rect/dom-rect-contract';

export const domNodeContract = z
  .object({
    tagName: z.string().brand<'DomNodeTagName'>().optional(),
    testId: z.string().brand<'DomNodeTestId'>().nullable().optional(),
    className: z.string().brand<'DomNodeClassName'>().nullable().optional(),
    childCount: z.number().int().nonnegative().brand<'DomNodeChildCount'>().optional(),
    display: z.string().brand<'DomNodeDisplay'>().optional(),
    visibility: z.string().brand<'DomNodeVisibility'>().optional(),
    opacity: z.string().brand<'DomNodeOpacity'>().optional(),
    rect: domRectContract.optional(),
    text: z.string().brand<'DomNodeText'>().optional(),
    attrs: z.array(attrPairContract).readonly().optional(),
    value: z.string().brand<'DomNodeValue'>().nullable().optional(),
  })
  .strict().brand<'DomNode'>();

export type DomNode = z.infer<typeof domNodeContract>;

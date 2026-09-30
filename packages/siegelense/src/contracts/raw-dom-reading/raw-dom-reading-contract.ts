/**
 * PURPOSE: What the page hands back from the `dom` step's one `page.evaluate` — carrying `count`
 * and unprojected raw DOM node objects, before `domReadTransformer` applies field projection,
 * match cap reporting, and warning note formatting.
 *
 * USAGE:
 * rawDomReadingContract.parse(await page.evaluate(source));
 * // Returns a validated RawDomReading
 */

import { z } from '#gateway/npm/zod';


import { attrPairContract } from '../attr-pair/attr-pair-contract';
import { domRectContract } from '../dom-rect/dom-rect-contract';

export const rawDomReadingContract = z.object({
  count: z.number().int().nonnegative().brand<'RawDomReadingCount'>(),
  nodes: z
    .array(
      z.object({
        tagName: z.string().brand<'RawDomReadingNodesTagName'>(),
        testId: z.string().brand<'RawDomReadingNodesTestId'>().nullable(),
        className: z.string().brand<'RawDomReadingNodesClassName'>().nullable(),
        childCount: z.number().int().nonnegative().brand<'RawDomReadingNodesChildCount'>(),
        display: z.string().brand<'RawDomReadingNodesDisplay'>(),
        visibility: z.string().brand<'RawDomReadingNodesVisibility'>(),
        opacity: z.string().brand<'RawDomReadingNodesOpacity'>(),
        rect: domRectContract,
        text: z.string().brand<'RawDomReadingNodesText'>(),
        attrs: z.array(attrPairContract).readonly(),
        value: z.string().brand<'RawDomReadingNodesValue'>().nullable(),
      }),
    )
    .readonly(),
});

export type RawDomReading = z.infer<typeof rawDomReadingContract>;

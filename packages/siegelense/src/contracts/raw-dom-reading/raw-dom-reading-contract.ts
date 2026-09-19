/**
 * PURPOSE: What the page hands back from the `dom` step's one `page.evaluate` — carrying `count`
 * and unprojected raw DOM node objects, before `domReadLayerAdapter` applies field projection,
 * match cap reporting, and warning note formatting.
 *
 * USAGE:
 * rawDomReadingContract.parse(await page.evaluate(source));
 * // Returns a validated RawDomReading
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { attrPairContract } from '../attr-pair/attr-pair-contract';
import { domRectContract } from '../dom-rect/dom-rect-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const rawDomReadingContract = z.object({
  count: readingCountContract,
  nodes: z
    .array(
      z.object({
        tagName: contentTextContract,
        testId: contentTextContract.nullable(),
        className: contentTextContract.nullable(),
        childCount: readingCountContract,
        display: contentTextContract,
        visibility: contentTextContract,
        opacity: contentTextContract,
        rect: domRectContract,
        text: contentTextContract,
        attrs: z.array(attrPairContract).readonly(),
        value: contentTextContract.nullable(),
      }),
    )
    .readonly(),
});

export type RawDomReading = z.infer<typeof rawDomReadingContract>;

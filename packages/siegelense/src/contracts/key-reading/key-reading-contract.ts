/**
 * PURPOSE: What the page hands back from the KEY's one `page.evaluate` — the rows as the DOM walk
 * found them, before the attrs budget, the `[n/m]` markers, the duplicate scan and the rendering
 * turn them into a `KeyListing`. Reach for this over `KeyListing` only at that boundary: a
 * KeyReading is the browser's answer and nothing else should ever hold one, while a KeyListing is
 * the reading a session reads.
 *
 * Three fields exist here and nowhere downstream, because each is a question only the walk can
 * answer and only the translation needs:
 *
 * - `parentRef` is the nearest ANCESTOR ROW, which is what makes `[n/m]` mean "among siblings the
 *   tree considers siblings" rather than "among DOM siblings" — the wrappers collapsed out before
 *   this was written.
 * - `highestRef` is the registry's length after the walk, which is the Node side's only way to tell
 *   a ref lost to a navigation from a ref that was never minted in this instance at all.
 * - `skipped` is what the row cap and the depth cap left out, grouped by the container it was left
 *   out of, because a key that quietly stops is the `count: 0` problem wearing a different hat
 *   (siegelense-tooling.md line 558).
 *
 * USAGE:
 * keyReadingContract.parse(await page.evaluate(source));
 * // Returns a validated KeyReading, and REJECTS a flag the statics do not name
 */

import { z } from 'zod';

import { arrayIndexContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { attrPairContract } from '../attr-pair/attr-pair-contract';
import { elementFlagContract } from '../element-flag/element-flag-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';
import { refContract } from '../ref/ref-contract';

export const keyReadingContract = z.object({
  rows: z
    .array(
      z.object({
        ref: refContract,
        depth: arrayIndexContract,
        parentRef: refContract.nullable(),
        testId: contentTextContract.nullable(),
        tag: contentTextContract,
        role: contentTextContract.nullable(),
        domId: contentTextContract.nullable(),
        text: contentTextContract.nullable(),
        value: contentTextContract.nullable(),
        placeholder: contentTextContract.nullable(),
        attributes: z.array(attrPairContract).readonly(),
        flags: z.array(elementFlagContract).readonly(),
        flagDetail: z.record(contentTextContract).readonly(),
      }),
    )
    .readonly(),
  highestRef: readingCountContract,
  skipped: z
    .array(z.object({ under: contentTextContract, count: readingCountContract }))
    .readonly(),
});

export type KeyReading = z.infer<typeof keyReadingContract>;

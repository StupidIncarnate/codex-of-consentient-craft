/**
 * PURPOSE: The element active in the DOM after a keyboard action — its tag, testId, role, domId,
 * text or value, and bound ref if one was minted.
 *
 * USAGE:
 * focusedElementContract.parse({
 *   tag: 'input',
 *   testId: 'NAME_INPUT',
 *   role: null,
 *   domId: null,
 *   text: 'alice',
 *   ref: 14,
 * });
 * // Returns a validated FocusedElement
 */

import { z } from '#gateway/npm/zod';



export const focusedElementContract = z
  .object({
    tag: z.string().brand<'FocusedElementTag'>(),
    testId: z.string().brand<'FocusedElementTestId'>().nullable(),
    role: z.string().brand<'FocusedElementRole'>().nullable(),
    domId: z.string().brand<'FocusedElementDomId'>().nullable(),
    text: z.string().brand<'FocusedElementText'>().nullable(),
    ref: z.number().int().positive().brand<'FocusedElementRef'>().nullable(),
  })
  .strict();

export type FocusedElement = z.infer<typeof focusedElementContract>;

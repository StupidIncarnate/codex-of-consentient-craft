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

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { refContract } from '../ref/ref-contract';

export const focusedElementContract = z
  .object({
    tag: contentTextContract,
    testId: contentTextContract.nullable(),
    role: contentTextContract.nullable(),
    domId: contentTextContract.nullable(),
    text: contentTextContract.nullable(),
    ref: refContract.nullable(),
  })
  .strict();

export type FocusedElement = z.infer<typeof focusedElementContract>;

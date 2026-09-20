/**
 * PURPOSE: What the `key` step returns from `session.pressKey` — the key press string that was sent,
 * and what element is focused in the DOM after the press (`document.activeElement`), or null if
 * body or nothing is focused.
 *
 * USAGE:
 * keyReadingContract.parse({ press: 'Enter', focused: null });
 * // Returns a validated KeyReading
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { focusedElementContract } from '../focused-element/focused-element-contract';

export const keyReadingContract = z
  .object({
    press: contentTextContract,
    focused: focusedElementContract.nullable(),
  })
  .strict();

export type KeyReading = z.infer<typeof keyReadingContract>;

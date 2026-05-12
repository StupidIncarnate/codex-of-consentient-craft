/**
 * PURPOSE: Branded literal-union type for the data-testid value passed to ShowEarlierToggleWidget — restricts to the two known callsite IDs
 *
 * USAGE:
 * toggleTestIdContract.parse('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE');
 * toggleTestIdContract.parse('CHAT_LIST_SHOW_EARLIER_TOGGLE');
 */

import { z } from 'zod';

export const toggleTestIdContract = z
  .enum(['SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE', 'CHAT_LIST_SHOW_EARLIER_TOGGLE'])
  .brand<'ToggleTestId'>();

export type ToggleTestId = z.infer<typeof toggleTestIdContract>;

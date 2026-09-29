/**
 * PURPOSE: One user line whose content is a plain string, parsed through the shared stream-line
 * contract. Reach for this over `UserTextStringStreamLineStub` inside a recipe: production code reads
 * literals and a contract, never a `.stub`. The line carries no `uuid` or `timestamp` — the caller
 * spreads those over it.
 *
 * USAGE:
 * transcriptUserTextLineTransformer({ text: 'Dispatch a nested sub-agent chain' });
 * // Returns { type: 'user', message: { role: 'user', content: 'Dispatch a nested sub-agent chain' } }
 */

import { userTextStreamLineContract } from '@dungeonmaster/shared/contracts';
import type { UserTextStreamLine } from '@dungeonmaster/shared/contracts';

export const transcriptUserTextLineTransformer = ({ text }: { text: string }): UserTextStreamLine =>
  userTextStreamLineContract.parse({
    type: 'user',
    message: { role: 'user', content: text },
  });

/**
 * PURPOSE: Defines the source origin of a JSONL chat line, distinguishing between primary session output and subagent output
 *
 * USAGE:
 * chatLineSourceContract.parse('session');
 * // Returns branded ChatLineSource
 */

import { z } from 'zod';

export const chatLineSourceContract = z.enum(['session', 'subagent']).brand<'ChatLineSource'>();

export type ChatLineSource = z.infer<typeof chatLineSourceContract>;

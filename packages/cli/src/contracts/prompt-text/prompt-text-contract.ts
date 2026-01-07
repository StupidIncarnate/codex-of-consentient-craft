/**
 * PURPOSE: Defines the branded string type for Claude prompt text
 *
 * USAGE:
 * promptTextContract.parse('You are an AI assistant...');
 * // Returns: PromptText branded string
 */

import { z } from 'zod';

export const promptTextContract = z.string().min(1).brand<'PromptText'>();

export type PromptText = z.infer<typeof promptTextContract>;

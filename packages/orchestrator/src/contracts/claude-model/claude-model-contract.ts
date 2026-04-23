/**
 * PURPOSE: Defines the Claude CLI `--model` flag values the orchestrator may pass when spawning an agent
 *
 * USAGE:
 * claudeModelContract.parse('haiku');
 * // Returns: ClaudeModel ('haiku' | 'sonnet' | 'opus')
 */

import { z } from 'zod';

export const claudeModelContract = z.enum(['haiku', 'sonnet', 'opus']);

export type ClaudeModel = z.infer<typeof claudeModelContract>;

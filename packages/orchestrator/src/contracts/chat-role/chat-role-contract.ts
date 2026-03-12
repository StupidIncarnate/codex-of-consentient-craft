/**
 * PURPOSE: Defines the role type for unified chat spawn (ChaosWhisperer or Glyphsmith)
 *
 * USAGE:
 * chatRoleContract.parse('chaoswhisperer');
 * // Returns branded ChatRole
 */

import { z } from 'zod';

export const chatRoleContract = z.enum(['chaoswhisperer', 'glyphsmith']).brand<'ChatRole'>();

export type ChatRole = z.infer<typeof chatRoleContract>;

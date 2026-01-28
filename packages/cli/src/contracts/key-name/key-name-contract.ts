/**
 * PURPOSE: Defines the branded union type for keyboard key names used in CLI debug mode
 *
 * USAGE:
 * keyNameContract.parse('enter');
 * // Returns branded KeyName type: 'enter'
 */
import { z } from 'zod';

export const keyNameContract = z
  .enum(['enter', 'escape', 'up', 'down', 'backspace', 'tab'] as const)
  .brand<'KeyName'>();

export type KeyName = z.infer<typeof keyNameContract>;

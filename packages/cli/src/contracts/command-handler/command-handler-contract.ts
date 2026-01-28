/**
 * PURPOSE: Defines the type for a function that handles debug commands
 *
 * USAGE:
 * const handler: CommandHandler = (cmd) => processCommand(cmd);
 */

import { z } from 'zod';

import type { DebugCommand } from '../debug-command/debug-command-contract';

export const commandHandlerContract = z.custom<(cmd: DebugCommand) => void>();

export type CommandHandler = z.infer<typeof commandHandlerContract>;

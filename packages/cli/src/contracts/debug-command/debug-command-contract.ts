/**
 * PURPOSE: Defines discriminated union types for CLI debug mode commands
 *
 * USAGE:
 * const command = debugCommandContract.parse({ action: 'start', screen: 'menu' });
 * // Returns validated DebugCommand for controlling CLI in debug mode
 */

import { z } from 'zod';

import { cliAppScreenContract } from '../cli-app-screen/cli-app-screen-contract';
import { keyNameContract } from '../key-name/key-name-contract';

const debugCommandStartContract = z.object({
  action: z.literal('start'),
  screen: cliAppScreenContract,
});

const debugCommandInputContract = z.object({
  action: z.literal('input'),
  text: z.string().min(1).brand<'DebugInputText'>(),
});

const debugCommandKeypressContract = z.object({
  action: z.literal('keypress'),
  key: keyNameContract,
});

const debugCommandGetScreenContract = z.object({
  action: z.literal('getScreen'),
});

const debugCommandExitContract = z.object({
  action: z.literal('exit'),
});

export const debugCommandContract = z.discriminatedUnion('action', [
  debugCommandStartContract,
  debugCommandInputContract,
  debugCommandKeypressContract,
  debugCommandGetScreenContract,
  debugCommandExitContract,
]);

export type DebugCommand = z.infer<typeof debugCommandContract>;
export type DebugCommandStart = z.infer<typeof debugCommandStartContract>;
export type DebugCommandInput = z.infer<typeof debugCommandInputContract>;
export type DebugCommandKeypress = z.infer<typeof debugCommandKeypressContract>;
export type DebugCommandGetScreen = z.infer<typeof debugCommandGetScreenContract>;
export type DebugCommandExit = z.infer<typeof debugCommandExitContract>;

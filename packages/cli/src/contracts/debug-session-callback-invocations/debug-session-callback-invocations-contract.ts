/**
 * PURPOSE: Defines the structure for tracking callback invocations during a debug session
 *
 * USAGE:
 * const invocations: DebugSessionCallbackInvocations = {
 *   onRunQuest: [],
 *   onExit: [],
 * };
 */

import { z } from 'zod';

import type { QuestId, Quest } from '@dungeonmaster/shared/contracts';

type QuestFolder = Quest['folder'];
type EmptyRecord = Record<PropertyKey, never>;

export const debugSessionCallbackInvocationsContract = z.object({
  onRunQuest: z.custom<{ questId: QuestId; questFolder: QuestFolder }[]>(),
  onExit: z.custom<EmptyRecord[]>(),
});

export type DebugSessionCallbackInvocations = z.infer<
  typeof debugSessionCallbackInvocationsContract
>;

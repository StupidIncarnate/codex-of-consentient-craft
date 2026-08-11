/**
 * PURPOSE: Describes an orchestration event payload from the dev-log formatters' point of view — a
 * read-only projection of the handful of fields they render, over a bus whose events carry many
 * other shapes.
 *
 * Every field is `.nullish()`, never `.optional()` alone. Orchestration events signal "this value
 * was never captured" with an explicit `null`, not by omitting the key: a chat spawn that dies
 * before its first stream-json init line emits `chat-complete` carrying `sessionId: null`. Since
 * the formatters run on EVERY event — and are evaluated as an argument to `processDevLogAdapter`,
 * so ahead of its VERBOSE gate — a schema that rejects null turns that event into an uncaught
 * throw inside `orchestrationEventsState.emit`, which takes the server process down.
 *
 * USAGE:
 * const parsed = devLogEventPayloadContract.parse(payload);
 * // Returns: { chatProcessId?, processId?, questId?, sessionId?, phase?, slotIndex?, role?, questions?[], entries?[] }
 */

import { z } from 'zod';

export const devLogEventPayloadContract = z
  .object({
    chatProcessId: z.string().min(1).brand<'DevLogProcessId'>().nullish(),
    processId: z.string().min(1).brand<'DevLogProcessId'>().nullish(),
    questId: z.string().min(1).brand<'DevLogQuestId'>().nullish(),
    sessionId: z.string().min(1).brand<'DevLogSessionId'>().nullish(),
    phase: z.string().min(1).brand<'DevLogPhase'>().nullish(),
    slotIndex: z.number().int().nonnegative().brand<'DevLogSlotIndex'>().nullish(),
    role: z.string().min(1).brand<'DevLogRole'>().nullish(),
    questions: z.array(z.unknown()).nullish(),
    entries: z.array(z.unknown()).nullish(),
  })
  .passthrough();

export type DevLogEventPayload = z.infer<typeof devLogEventPayloadContract>;

/**
 * PURPOSE: Result returned by questGetServerConfigBroker — `{baseUrl, port}` for the dungeonmaster server the orchestrator process is bound to; the MCP responder relays it to slash commands so they can point the browser at the running server
 *
 * USAGE:
 * const result: QuestGetServerConfigResult = questGetServerConfigResultContract.parse({
 *   baseUrl: 'http://dungeonmaster.localhost:3737',
 *   port: 3737,
 * });
 * // Returned synchronously by quest-get-server-config-broker.
 */

import { z } from '#gateway/npm/zod';

export const questGetServerConfigResultContract = z
  .object({
    baseUrl: z.url().brand<'QuestGetServerConfigResultBaseUrl'>(),
    port: z.number().int().min(1).max(65_535).brand<'QuestGetServerConfigResultPort'>(),
  })
  .brand<'QuestGetServerConfigResult'>();

export type QuestGetServerConfigResult = z.infer<typeof questGetServerConfigResultContract>;

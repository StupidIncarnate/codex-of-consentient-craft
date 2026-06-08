/**
 * PURPOSE: Captures incoming WebSocket lifecycle frames (`quest-paused`, `quest-resumed`) for a given questId
 * and exposes a poll-friendly accessor so e2e tests can wait for the orchestrator's announcement to land.
 *
 * USAGE:
 * const lifecycle = wsQuestLifecycleHarness({ page, questId });
 * lifecycle.beforeEach();
 * await expect
 *   .poll(() => lifecycle.matchedQuestIdsFor({ eventType: 'quest-paused' }).length, { timeout: 10_000 })
 *   .toBe(1);
 */
import type { Page } from '@playwright/test';
import { z } from 'zod';

const wsQuestLifecycleFrameContract = z
  .object({
    type: z.enum(['quest-paused', 'quest-resumed']),
    payload: z
      .object({
        questId: z.unknown().optional(),
      })
      .passthrough(),
  })
  .passthrough();

interface CapturedLifecycleFrame {
  type: 'quest-paused' | 'quest-resumed';
  payloadQuestId: unknown;
}

export const wsQuestLifecycleHarness = ({
  page,
  questId,
}: {
  page: Page;
  questId: string;
}): {
  beforeEach: () => void;
  matchedQuestIdsFor: (params: {
    eventType: 'quest-paused' | 'quest-resumed';
  }) => readonly unknown[];
} => {
  const captured: CapturedLifecycleFrame[] = [];

  return {
    beforeEach: (): void => {
      captured.length = 0;
      page.on('websocket', (ws) => {
        ws.on('framereceived', (data) => {
          const rawPayload = data.payload;
          const payloadAsString =
            typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf-8');
          const parsedJson = ((): unknown => {
            try {
              return JSON.parse(payloadAsString);
            } catch {
              return undefined;
            }
          })();
          if (parsedJson === undefined) {
            return;
          }
          const parsedFrame = wsQuestLifecycleFrameContract.safeParse(parsedJson);
          if (!parsedFrame.success) {
            return;
          }
          captured.push({
            type: parsedFrame.data.type,
            payloadQuestId: parsedFrame.data.payload.questId,
          });
        });
      });
    },

    matchedQuestIdsFor: ({
      eventType,
    }: {
      eventType: 'quest-paused' | 'quest-resumed';
    }): readonly unknown[] =>
      captured
        .filter((frame) => frame.type === eventType && frame.payloadQuestId === questId)
        .map((frame) => frame.payloadQuestId),
  };
};

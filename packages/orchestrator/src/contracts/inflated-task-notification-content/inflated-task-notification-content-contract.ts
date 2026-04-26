/**
 * PURPOSE: Validates the post-XML-inflate shape of a Claude CLI user message's `message.content`
 * field when the original content string was a single `<task-notification>` XML envelope. The
 * shared `inflate-xml-strings-transformer` replaces such strings with `{ taskNotification: {...} }`,
 * and the chat-line processor lifts that nested object up to the line level for downstream
 * `parse-user-stream-entry-transformer` consumption.
 *
 * USAGE:
 * const c = inflatedTaskNotificationContentContract.parse(message.content);
 * if (c.taskNotification) { ... }
 *
 * `.passthrough()` so any non-task-notification keys (e.g., other XML siblings) survive.
 */
import { z } from 'zod';

export const inflatedTaskNotificationContentContract = z
  .object({
    taskNotification: z.unknown().optional(),
  })
  .passthrough();

export type InflatedTaskNotificationContent = z.infer<
  typeof inflatedTaskNotificationContentContract
>;

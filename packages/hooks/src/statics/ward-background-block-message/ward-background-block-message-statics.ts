/**
 * PURPOSE: Message shown when a ward command is launched in the background. A backgrounded ward
 *          strands the agent with no reliable completion signal, so it must run in the foreground.
 *
 * USAGE:
 * import { wardBackgroundBlockMessageStatics } from './ward-background-block-message-statics';
 * // wardBackgroundBlockMessageStatics.blockMessage
 */

export const wardBackgroundBlockMessageStatics = {
  blockMessage:
    'BLOCKED: Do not run ward in the background. A backgrounded ward run gives no reliable completion signal — the agent ends up sleep-polling a file that never updates. Run ward in the FOREGROUND with `timeout: 600000` and wait for it to finish.',
} as const;

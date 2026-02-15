/**
 * PURPOSE: Computes the raccoon sprite flip animation interval based on chat streaming state
 *
 * USAGE:
 * raccoonAnimationIntervalTransformer({ isStreaming: true, entries });
 * // Returns AnimationIntervalMs based on chat state (idle: 2000ms, thinking: 500ms, tool call: 300ms)
 */

import { animationIntervalMsContract } from '../../contracts/animation-interval-ms/animation-interval-ms-contract';
import type { AnimationIntervalMs } from '../../contracts/animation-interval-ms/animation-interval-ms-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';

const IDLE_INTERVAL = animationIntervalMsContract.parse(
  raccoonAnimationConfigStatics.idleIntervalMs,
);
const THINKING_INTERVAL = animationIntervalMsContract.parse(
  raccoonAnimationConfigStatics.thinkingIntervalMs,
);
const TOOL_CALL_INTERVAL = animationIntervalMsContract.parse(
  raccoonAnimationConfigStatics.toolCallIntervalMs,
);

export const raccoonAnimationIntervalTransformer = ({
  isStreaming,
  entries,
}: {
  isStreaming: boolean;
  entries: ChatEntry[];
}): AnimationIntervalMs => {
  if (!isStreaming) return IDLE_INTERVAL;

  const lastEntry = entries.at(-1);

  if (lastEntry === undefined) return IDLE_INTERVAL;
  if (lastEntry.role === 'user') return THINKING_INTERVAL;
  if (lastEntry.type === 'tool_use') return TOOL_CALL_INTERVAL;

  return THINKING_INTERVAL;
};

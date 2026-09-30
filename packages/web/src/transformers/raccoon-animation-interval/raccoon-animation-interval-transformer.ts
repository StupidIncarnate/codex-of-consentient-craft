/**
 * PURPOSE: Computes the raccoon sprite flip animation interval based on chat streaming state
 *
 * USAGE:
 * raccoonAnimationIntervalTransformer({ isStreaming: true, entries });
 * // Returns AnimationIntervalMs based on chat state (idle: 2000ms, thinking: 500ms, tool call: 300ms)
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';

const IDLE_INTERVAL = raccoonAnimationConfigStatics.idleIntervalMs;
const THINKING_INTERVAL = raccoonAnimationConfigStatics.thinkingIntervalMs;
const TOOL_CALL_INTERVAL = raccoonAnimationConfigStatics.toolCallIntervalMs;

export const raccoonAnimationIntervalTransformer = ({
  isStreaming,
  entries,
}: {
  isStreaming: boolean;
  entries: ChatEntry[];
}): number => {
  if (!isStreaming) return IDLE_INTERVAL;

  const lastEntry = entries.at(-1);

  if (lastEntry === undefined) return IDLE_INTERVAL;
  if (lastEntry.role === 'user') return THINKING_INTERVAL;
  if (lastEntry.type === 'tool_use') return TOOL_CALL_INTERVAL;

  return THINKING_INTERVAL;
};

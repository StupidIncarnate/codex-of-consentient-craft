/**
 * PURPOSE: Wraps access to the ChaosWhisperer prompt statics from the orchestrator package
 *
 * USAGE:
 * const { template, argumentsPlaceholder } = chaoswhispererPromptAdapter();
 * // Returns prompt template and placeholder value for CLI prompt assembly
 */

import { chaoswhispererPromptStatics } from '@dungeonmaster/orchestrator';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const chaoswhispererPromptAdapter = (): {
  template: ContentText;
  argumentsPlaceholder: ContentText;
} => ({
  template: contentTextContract.parse(chaoswhispererPromptStatics.prompt.template),
  argumentsPlaceholder: contentTextContract.parse(
    chaoswhispererPromptStatics.prompt.placeholders.arguments,
  ),
});

/**
 * PURPOSE: Appends the read-the-images trailer to a prompt that already carries pasted-image
 * tokens. Reach for this over `chatPromptBuildTransformer` when the prompt text is already final
 * (a raw follow-up message, a resumed-session prompt) and only needs the trailer spliced on —
 * chatPromptBuildTransformer fills a role's template and has no notion of pasted images at all.
 *
 * USAGE:
 * imagePromptTrailerTransformer({ promptText: 'Look at ![Pasted Image 1](/tmp/a.png)' });
 * // Returns branded PromptText with the sentinel + instruction trailer appended
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { promptTextContract } from '../../contracts/prompt-text/prompt-text-contract';
import type { PromptText } from '../../contracts/prompt-text/prompt-text-contract';

export const imagePromptTrailerTransformer = ({
  promptText,
}: {
  promptText: string;
}): PromptText => {
  const carriesImageToken = new RegExp(pastedImageStatics.imageTokenPattern, 'u').test(promptText);
  const alreadyTrailed = promptText.includes(pastedImageStatics.promptSentinel);
  if (!carriesImageToken || alreadyTrailed) return promptTextContract.parse(promptText);
  return promptTextContract.parse(
    `${promptText}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
  );
};

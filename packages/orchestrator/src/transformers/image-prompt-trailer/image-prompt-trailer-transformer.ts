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

export const imagePromptTrailerTransformer = ({ promptText }: { promptText: string }): string => {
  const carriesImageToken = new RegExp(pastedImageStatics.imageTokenPattern, 'u').test(promptText);
  const alreadyTrailed = promptText.includes(pastedImageStatics.promptSentinel);
  if (!carriesImageToken || alreadyTrailed) return promptText;
  return `${promptText}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;
};

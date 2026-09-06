/**
 * PURPOSE: Turns the browser's bare per-message placeholder tokens into the markdown image
 * syntax the rest of the pipeline expects, mapping each token to its file by the ORDINAL the
 * token names rather than by where it sits in the text. Reach for this over the orchestrator's
 * `imagePromptTrailerTransformer`, which appends the read-the-images trailer to a prompt that
 * ALREADY carries rewritten tokens — this is the step that has to run first, before that prompt
 * exists.
 *
 * USAGE:
 * pastedImageTokenSubstituteTransformer({ message: 'See [Pasted Image 1]', imagePaths: [path] });
 * // Returns branded UserMessage with the token rewritten to '![Pasted Image 1](<path>)'
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { userMessageContract } from '../../contracts/user-message/user-message-contract';
import type { UserMessage } from '../../contracts/user-message/user-message-contract';

export const pastedImageTokenSubstituteTransformer = ({
  message,
  imagePaths,
}: {
  message: string;
  imagePaths: readonly AbsoluteFilePath[];
}): UserMessage =>
  userMessageContract.parse(
    message.replace(
      new RegExp(`(?<!!)${pastedImageStatics.placeholderPattern}`, 'gu'),
      (match: string, ordinal: string) => {
        const imagePath = imagePaths[Number(ordinal) - 1];
        return imagePath === undefined ? match : `![Pasted Image ${ordinal}](${imagePath})`;
      },
    ),
  );

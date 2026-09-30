/**
 * PURPOSE: Extracts content changes (old vs new) from Write, Edit, or MultiEdit tool inputs
 *
 * USAGE:
 * const changes = await toolInputGetContentChangesBroker({ toolInput: writeToolInput });
 * // Returns array of ContentChange with oldContent and newContent
 */
import type { ToolInput } from '../../../contracts/tool-input/tool-input-contract';
import type { ContentChange } from '../../../contracts/content-change/content-change-contract';
import { contentChangeContract } from '../../../contracts/content-change/content-change-contract';
import { toolInputGetFullContentBroker } from '../get-full-content/tool-input-get-full-content-broker';
import { fileReadOrEmptyBroker } from '../../file/read-or-empty/file-read-or-empty-broker';

export const toolInputGetContentChangesBroker = async ({
  toolInput,
}: {
  toolInput: ToolInput;
}): Promise<ContentChange[]> => {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (filePath === '') {
    return [];
  }

  // Handle Write tool
  if ('content' in toolInput) {
    const oldContent = await fileReadOrEmptyBroker({
      filePath: filePath,
    });

    return [
      contentChangeContract.parse({
        oldContent,
        newContent: toolInput.content,
      }),
    ];
  }

  // Handle Edit tool
  if ('new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput)) {
    const oldContent = await fileReadOrEmptyBroker({
      filePath: filePath,
    });

    const newContent = await toolInputGetFullContentBroker({ toolInput });

    if (newContent === null) {
      return [];
    }

    return [
      contentChangeContract.parse({
        oldContent,
        newContent: newContent,
      }),
    ];
  }

  // Handle MultiEdit tool
  if ('edits' in toolInput) {
    const oldContent = await fileReadOrEmptyBroker({
      filePath: filePath,
    });

    const newContent = await toolInputGetFullContentBroker({ toolInput });

    if (newContent === null) {
      return [];
    }

    return [
      contentChangeContract.parse({
        oldContent,
        newContent: newContent,
      }),
    ];
  }

  return [];
};

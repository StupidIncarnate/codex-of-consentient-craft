/**
 * PURPOSE: Computes full file content after applying Write, Edit, or MultiEdit operations
 *
 * USAGE:
 * const newContent = await toolInputGetFullContentBroker({ toolInput: editToolInput });
 * // Returns full file content string after applying edits, or null if not applicable
 */
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import type { ToolInput } from '../../../contracts/tool-input/tool-input-contract';
import { regexEscapeTransformer } from '../../../transformers/regex-escape/regex-escape-transformer';
import { isNodeErrorContract } from '../../../contracts/is-node-error/is-node-error-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const toolInputGetFullContentBroker = async ({
  toolInput,
}: {
  toolInput: ToolInput;
}): Promise<FileContents | null> => {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (filePath === '') {
    return null;
  }

  // For Write tool, we already have the full content
  if ('content' in toolInput) {
    return fileContentsContract.parse(toolInput.content);
  }

  // Read file content - return null if file doesn't exist
  const readResult = await fsReadFileAdapter({ filePath: filePathContract.parse(filePath) }).catch(
    (error: unknown) => {
      const isNodeError = isNodeErrorContract({ error });
      if (isNodeError) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          return null;
        }
      }
      throw error;
    },
  );

  if (readResult === null) {
    return null;
  }

  const existingContent = readResult;

  // For Edit tool, apply the single edit
  if ('new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput)) {
    if (toolInput.replace_all === true) {
      const escapedPattern = regexEscapeTransformer({ str: toolInput.old_string });
      const regex = new RegExp(String(escapedPattern), 'gu');
      return fileContentsContract.parse(existingContent.replace(regex, toolInput.new_string));
    }

    return fileContentsContract.parse(
      existingContent.replace(toolInput.old_string, toolInput.new_string),
    );
  }

  // For MultiEdit tool, apply all edits sequentially
  if ('edits' in toolInput && Array.isArray(toolInput.edits)) {
    let result = existingContent;

    for (const editItem of toolInput.edits) {
      // Type guard check
      if (typeof editItem !== 'object' || editItem === null || Array.isArray(editItem)) {
        throw new Error('Invalid edit format: expected object');
      }

      const oldString: unknown = Reflect.get(editItem, 'old_string');
      const newString: unknown = Reflect.get(editItem, 'new_string');
      const replaceAll: unknown = Reflect.get(editItem, 'replace_all');

      const oldStringStr = typeof oldString === 'string' ? oldString : String(oldString);
      const newStringStr = typeof newString === 'string' ? newString : String(newString);

      if (replaceAll === true) {
        const escapedPattern = regexEscapeTransformer({ str: oldStringStr });
        const regex = new RegExp(String(escapedPattern), 'gu');
        result = fileContentsContract.parse(result.replace(regex, newStringStr));
      } else {
        result = fileContentsContract.parse(result.replace(oldStringStr, newStringStr));
      }
    }

    return result;
  }

  return null;
};

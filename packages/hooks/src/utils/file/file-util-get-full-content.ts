import { readFile } from 'fs/promises';
import type { ToolInput, WriteToolInput, MultiEditToolInput } from '../../types/tool-type';
import { fileUtilEscapeRegex } from './file-util-escape-regex';
import { fileUtilIsNodeError } from './file-util-is-node-error';

export const fileUtilGetFullFileContent = async ({ toolInput }: { toolInput: ToolInput }) => {
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  if (!filePath) {
    return null;
  }

  // For Write tool, we already have the full content
  if ('content' in toolInput) {
    return toolInput.content;
  }

  try {
    // Read the existing file content
    const existingContent = await readFile(filePath, 'utf-8');

    // For Edit tool, apply the single edit
    if ('new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput)) {
      const editInput = toolInput;
      if (editInput.replace_all) {
        // Use global regex replace for replaceAll functionality
        const regex = new RegExp(fileUtilEscapeRegex({ str: editInput.old_string }), 'g');
        return existingContent.replace(regex, editInput.new_string);
      } else {
        return existingContent.replace(editInput.old_string, editInput.new_string);
      }
    }

    // For MultiEdit tool, apply all edits sequentially
    if ('edits' in toolInput) {
      const multiEditInput = toolInput as MultiEditToolInput;
      let content = existingContent;

      for (const edit of multiEditInput.edits) {
        if (edit.replace_all) {
          // Use global regex replace for replaceAll functionality
          const regex = new RegExp(fileUtilEscapeRegex({ str: edit.old_string }), 'g');
          content = content.replace(regex, edit.new_string);
        } else {
          content = content.replace(edit.old_string, edit.new_string);
        }
      }

      return content;
    }
  } catch (error) {
    // If file doesn't exist (new file), we can't determine the content
    if (fileUtilIsNodeError(error) && error.code === 'ENOENT') {
      // For Write tool with new files, use the content
      if ('content' in toolInput) {
        return (toolInput as WriteToolInput).content;
      }
      // For Edit/MultiEdit on non-existent files, we can't proceed
      return null;
    }
    // For other errors, propagate them
    throw error;
  }

  return null;
};

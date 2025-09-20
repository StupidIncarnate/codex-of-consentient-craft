import { readFile } from 'fs/promises';
import type { ToolInput } from '../../types/tool-type';
import { fileUtilGetFullFileContent } from './get-full-content';
import { isNodeError } from './is-node-error';

export interface ContentChange {
  oldContent: string;
  newContent: string;
}

export const getContentChanges = async ({ toolInput }: { toolInput: ToolInput }) => {
  const changes: ContentChange[] = [];
  const filePath = 'file_path' in toolInput ? toolInput.file_path : '';

  // For Write tool, need to check against existing file content
  if ('content' in toolInput && filePath) {
    let oldContent = '';
    try {
      // Try to read existing file content
      oldContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      // File doesn't exist - new file case
      if (isNodeError(error) && error.code !== 'ENOENT') {
        throw error;
      }
    }
    changes.push({ oldContent, newContent: toolInput.content });
  }
  // For Edit tool, check the full file content before and after the edit
  else if (
    'new_string' in toolInput &&
    'old_string' in toolInput &&
    !('edits' in toolInput) &&
    filePath
  ) {
    let oldContent = '';
    try {
      // Try to read existing file content
      oldContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      // File doesn't exist - new file case
      if (isNodeError(error) && error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Get the full file content after applying the edit
    const newContent = await fileUtilGetFullFileContent({ toolInput });
    if (newContent !== null) {
      changes.push({ oldContent, newContent });
    }
  }
  // For MultiEdit tool, check the full file content before and after all edits
  else if ('edits' in toolInput && filePath) {
    let oldContent = '';
    try {
      // Try to read existing file content
      oldContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      // File doesn't exist - new file case
      if (isNodeError(error) && error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Get the full file content after applying all edits
    const newContent = await fileUtilGetFullFileContent({ toolInput });
    if (newContent !== null) {
      changes.push({ oldContent, newContent });
    }
  }

  return changes;
};

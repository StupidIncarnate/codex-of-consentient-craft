import { readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import debug from 'debug';
import type { ToolInput, WriteToolInput, MultiEditToolInput } from '../types';

const log = debug('questmaestro:session-start-hook');

export interface ContentChange {
  oldContent: string;
  newContent: string;
}

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && 'code' in error;

export const FileUtils = {
  escapeRegex: ({ str }: { str: string }) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  getFileExtension: ({ filePath }: { filePath: string }) => {
    const match = filePath.match(/\.[^.]*$/);
    return match ? match[0] : '';
  },

  getFullFileContent: async ({ toolInput }: { toolInput: ToolInput }) => {
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
          const regex = new RegExp(FileUtils.escapeRegex({ str: editInput.old_string }), 'g');
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
            const regex = new RegExp(FileUtils.escapeRegex({ str: edit.old_string }), 'g');
            content = content.replace(regex, edit.new_string);
          } else {
            content = content.replace(edit.old_string, edit.new_string);
          }
        }

        return content;
      }
    } catch (error) {
      // If file doesn't exist (new file), we can't determine the content
      if (isNodeError(error) && error.code === 'ENOENT') {
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
  },

  getContentChanges: async ({ toolInput }: { toolInput: ToolInput }) => {
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
    // For Edit tool, we have explicit old and new strings
    else if ('new_string' in toolInput && 'old_string' in toolInput && !('edits' in toolInput)) {
      changes.push({ oldContent: toolInput.old_string, newContent: toolInput.new_string });
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
      const newContent = await FileUtils.getFullFileContent({ toolInput });
      if (newContent !== null) {
        changes.push({ oldContent, newContent });
      }
    }

    return changes;
  },

  isNewSession: async ({ transcriptPath }: { transcriptPath: string }) => {
    try {
      if (!existsSync(transcriptPath)) {
        return true; // No transcript = new session
      }

      const stats = await stat(transcriptPath);
      const fileSize = stats.size;

      // If transcript is very small (< 1KB), likely a new session
      // You could also check content or timestamp
      return fileSize < 1024;
    } catch {
      return true; // Error reading = treat as new
    }
  },

  loadStandardsFiles: async ({ cwd }: { cwd: string }) => {
    const standardsFiles = ['coding-principles.md', 'testing-standards.md'];

    const standardsPath = resolve(cwd, 'node_modules/@questmaestro/standards');
    let content = '';

    for (const file of standardsFiles) {
      const filePath = resolve(standardsPath, file);

      if (existsSync(filePath)) {
        try {
          const fileContent = await readFile(filePath, 'utf8');
          content += `\n\n# ${file.replace('.md', '').replace('-', ' ').toUpperCase()}\n\n`;
          content += fileContent;
          log(`Loaded standards file: ${file}`);
        } catch (error) {
          log(`Failed to load ${file}:`, error);
        }
      } else {
        log(`Standards file not found: ${filePath}`);
      }
    }

    return content;
  },
};

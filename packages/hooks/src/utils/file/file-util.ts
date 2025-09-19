import { fileUtilEscapeRegex } from './file-util-escape-regex';
import { fileUtilGetFileExtension } from './file-util-get-extension';
import { fileUtilGetFullFileContent } from './file-util-get-full-content';
import { fileUtilGetContentChanges } from './file-util-get-content-changes';
import { fileUtilIsNewSession } from './file-util-is-new-session';
import { fileUtilLoadStandardsFiles } from './file-util-load-standards-files';
import { fileUtilIsNodeError } from './file-util-is-node-error';

export const FileUtil = {
  escapeRegex: fileUtilEscapeRegex,
  getFileExtension: fileUtilGetFileExtension,
  getFullFileContent: fileUtilGetFullFileContent,
  getContentChanges: fileUtilGetContentChanges,
  isNewSession: fileUtilIsNewSession,
  loadStandardsFiles: fileUtilLoadStandardsFiles,
  isNodeError: fileUtilIsNodeError,
};

// Re-export the ContentChange interface for backward compatibility
export type { ContentChange } from './file-util-get-content-changes';

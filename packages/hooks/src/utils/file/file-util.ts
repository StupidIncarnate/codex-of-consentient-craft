import { escapeRegex } from './escape-regex';
import { fileUtilGetFileExtension } from './get-extension';
import { fileUtilGetFullFileContent } from './get-full-content';
import { getContentChanges } from './get-content-changes';
import { isNewSession } from './is-new-session';
import { loadStandardsFiles } from './load-standards-files';
import { isNodeError } from './is-node-error';

export const FileUtil = {
  escapeRegex,
  getFileExtension: fileUtilGetFileExtension,
  getFullFileContent: fileUtilGetFullFileContent,
  getContentChanges,
  isNewSession,
  loadStandardsFiles,
  isNodeError,
};

// Re-export the ContentChange interface for backward compatibility
export type { ContentChange } from './get-content-changes';

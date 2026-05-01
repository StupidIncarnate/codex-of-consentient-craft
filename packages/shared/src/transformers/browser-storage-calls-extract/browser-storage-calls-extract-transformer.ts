/**
 * PURPOSE: Extracts browser storage write call sites from TypeScript source text using regex
 *
 * USAGE:
 * const writes = browserStorageCallsExtractTransformer({
 *   source: contentTextContract.parse('localStorage.setItem("session-id", value)'),
 * });
 * // Returns ['localStorage: session-id'] as ContentText[]
 *
 * WHEN-TO-USE: State-writes broker scanning web-package source files for browser storage usage
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';

// Matches: localStorage.setItem('key', ...) or sessionStorage.setItem('key', ...)
const LOCAL_SESSION_PATTERN = /\b(localStorage|sessionStorage)\.setItem\s*\(\s*['"]([^'"]+)['"]/gu;

// Matches: indexedDB.open('name', ...)
const INDEXED_DB_PATTERN = /\bindexedDB\.open\s*\(\s*['"]([^'"]+)['"]/gu;

export const browserStorageCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const results: ContentText[] = [];
  const { localStoragePrefix, sessionStoragePrefix, indexedDbPrefix } =
    projectMapStatics.browserStoragePatterns;

  LOCAL_SESSION_PATTERN.lastIndex = 0;
  let match = LOCAL_SESSION_PATTERN.exec(String(source));
  while (match !== null) {
    const [, storageType, key] = match;
    if (storageType !== undefined && key !== undefined) {
      const prefix = storageType === 'localStorage' ? localStoragePrefix : sessionStoragePrefix;
      results.push(contentTextContract.parse(`${prefix}${key}`));
    }
    match = LOCAL_SESSION_PATTERN.exec(String(source));
  }

  INDEXED_DB_PATTERN.lastIndex = 0;
  let dbMatch = INDEXED_DB_PATTERN.exec(String(source));
  while (dbMatch !== null) {
    const [, dbName] = dbMatch;
    if (dbName !== undefined) {
      results.push(contentTextContract.parse(`${indexedDbPrefix}${dbName}`));
    }
    dbMatch = INDEXED_DB_PATTERN.exec(String(source));
  }

  return results;
};

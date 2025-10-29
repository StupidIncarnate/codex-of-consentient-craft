/**
 * PURPOSE: Provide semantic data builders for testing has-metadata-comment-guard paths
 *
 * USAGE:
 * const guardProxy = hasMetadataCommentGuardProxy();
 * const validContents = guardProxy.setupValidMetadata();
 * // Returns FileContents with all required metadata sections
 */

import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

export const hasMetadataCommentGuardProxy = (): {
  setupValidMetadata: () => FileContents;
  setupMissingPurpose: () => FileContents;
  setupMissingUsage: () => FileContents;
} =>
  // Guard runs real, proxy just builds test data

  ({
    setupValidMetadata: (): FileContents =>
      FileContentsStub({
        value: `/**
 * PURPOSE: Test function
 *
 * USAGE:
 * testFunction();
 */
export const testFunction = () => {};
`,
      }),

    setupMissingPurpose: (): FileContents =>
      FileContentsStub({
        value: `/**
 * USAGE:
 * testFunction();
 */
export const testFunction = () => {};
`,
      }),

    setupMissingUsage: (): FileContents =>
      FileContentsStub({
        value: `/**
 * PURPOSE: Test function
 */
export const testFunction = () => {};
`,
      }),
  });

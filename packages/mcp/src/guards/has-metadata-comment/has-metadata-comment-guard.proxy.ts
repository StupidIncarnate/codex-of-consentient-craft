/**
 * PURPOSE: Provide semantic data builders for testing has-metadata-comment-guard paths
 *
 * USAGE:
 * const guardProxy = hasMetadataCommentGuardProxy();
 * const validContents = guardProxy.setupValidMetadata();
 * // Returns FileContents with all required metadata sections
 */


export const hasMetadataCommentGuardProxy = (): {
  setupValidMetadata: () => string;
  setupMissingPurpose: () => string;
  setupMissingUsage: () => string;
} =>
  // Guard runs real, proxy just builds test data

  ({
    setupValidMetadata: (): string =>
      `/**
 * PURPOSE: Test function
 *
 * USAGE:
 * testFunction();
 */
export const testFunction = () => {};
`,

    setupMissingPurpose: (): string =>
      `/**
 * USAGE:
 * testFunction();
 */
export const testFunction = () => {};
`,

    setupMissingUsage: (): string =>
      `/**
 * PURPOSE: Test function
 */
export const testFunction = () => {};
`,
  });

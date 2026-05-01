/**
 * PURPOSE: Configuration for the URL segment extraction — segments to skip when deriving keywords
 *
 * USAGE:
 * urlSegmentsExtractStatics.skipPrefixes; // [':', 'api']
 *
 * WHEN-TO-USE: urlSegmentsExtractTransformer filtering URL path segments to keyword candidates
 */

export const urlSegmentsExtractStatics = {
  skipPrefixes: [':', 'api'],
} as const;

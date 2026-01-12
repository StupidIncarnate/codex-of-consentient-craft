/**
 * PURPOSE: Defines supported file extensions for source code files across the codebase
 *
 * USAGE:
 * fileExtensionsStatics.source.all;
 * // Returns ['.ts', '.tsx', '.js', '.jsx'] for all source extensions
 *
 * fileExtensionsStatics.globs.all;
 * // Returns '*.{ts,tsx,js,jsx}' for glob patterns
 */

export const fileExtensionsStatics = {
  source: {
    typescript: ['.ts', '.tsx'],
    javascript: ['.js', '.jsx'],
    all: ['.ts', '.tsx', '.js', '.jsx'],
  },
  globs: {
    typescript: '*.{ts,tsx}',
    javascript: '*.{js,jsx}',
    all: '*.{ts,tsx,js,jsx}',
  },
} as const;

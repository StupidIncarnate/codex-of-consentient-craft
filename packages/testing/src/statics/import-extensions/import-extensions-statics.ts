/**
 * PURPOSE: Defines supported file extensions for import path resolution
 *
 * USAGE:
 * importExtensionsStatics.typescript;
 * // Returns ['.ts', '.tsx'] for TypeScript extensions
 */

export const importExtensionsStatics = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx'],
  all: ['.ts', '.tsx', '.js', '.jsx'],
} as const;

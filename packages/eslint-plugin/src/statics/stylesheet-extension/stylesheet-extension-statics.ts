/**
 * PURPOSE: The file extensions of the stylesheets a bundler consumes. raw-import-ban skips a
 * side-effect import (no specifiers) of a file with one of these extensions, because a stylesheet
 * is not code and no gateway can wrap it.
 *
 * USAGE:
 * stylesheetExtensionStatics.extensions.some((extension) => importSource.endsWith(extension));
 * // Returns true for '@mantine/core/styles.css'
 */
export const stylesheetExtensionStatics = {
  extensions: ['.css', '.scss', '.sass', '.less', '.styl', '.pcss'],
} as const;

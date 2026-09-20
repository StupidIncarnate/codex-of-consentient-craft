/**
 * PURPOSE: Immutable configuration values and defaults for the `file` step verb, defining the
 * default file encoding ('utf8') and error message templates for file reading and path validation.
 * Reach for this over inline literals so file step settings stay centralized and consistent across
 * contracts, errors, and brokers.
 *
 * USAGE:
 * fileStatics.defaults.encoding;
 * // Returns 'utf8'
 *
 * fileStatics.errors.notFoundTemplate;
 * // Returns 'file "{path}" does not exist in lane home "{homePath}"'
 */

export const fileStatics = {
  defaults: {
    encoding: 'utf8',
  },
  errors: {
    notFoundTemplate: 'file "{path}" does not exist in lane home "{homePath}"',
    leadingSlash:
      'a `file` step path is resolved against the lane\'s own throwaway home and must not start with "/" — a leading slash would escape the lane the walk is driving. Try { "step": "file", "path": "guilds/<id>/quests/<id>/quest.json" }',
    traversal:
      'a `file` step path must not contain ".." directory traversal — traversal would escape the lane the walk is driving. Try { "step": "file", "path": "guilds/<id>/quests/<id>/quest.json" }',
  },
} as const;

/**
 * PURPOSE: Defines immutable configuration values for tool call display formatting
 *
 * USAGE:
 * toolDisplayConfigStatics.limits.maxLineLength;
 * // Returns 80 - maximum line length for tool display
 */

export const toolDisplayConfigStatics = {
  limits: {
    maxLineLength: 500,
    maxValueLength: 200,
    maxParams: 3,
  },
  formatting: {
    ellipsis: '...',
  },
  priorityKeys: {
    ordered: ['file_path', 'path', 'pattern', 'query', 'url', 'prompt', 'command', 'action'],
  },
} as const;

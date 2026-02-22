/**
 * PURPOSE: Defines command prefixes that indicate a user message is a system command rather than a real user question
 *
 * USAGE:
 * userMessageCommandPrefixesStatics.prefixes;
 * // Returns ['<local-command', '<command', '<task-notification>', '<system-reminder>']
 */

export const userMessageCommandPrefixesStatics = {
  prefixes: ['<local-command', '<command', '<task-notification>', '<system-reminder>'],
} as const;

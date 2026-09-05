/**
 * PURPOSE: The tool_use input keys worth printing in a one-line brief, listed in the priority
 * order a brief renders them. A real tool `input` carries far more keys than a terminal-width
 * timeline can show at once. This is the curated subset that actually explains what a call did:
 * the file it touched, the command it ran, or the query it searched for. Printing this subset
 * avoids dumping the whole input blob.
 *
 * USAGE:
 * toolBriefKeyStatics.interestingKeys[0];
 * // Returns 'file_path', the first key a brief looks for
 */

export const toolBriefKeyStatics = {
  interestingKeys: [
    'file_path',
    'path',
    'command',
    'pattern',
    'glob',
    'grep',
    'url',
    'description',
    'prompt',
    'subagent_type',
    'old_string',
    'query',
    'agent',
    'questId',
    'workItemId',
    'notes',
    'packages',
    'packageName',
  ],
} as const;

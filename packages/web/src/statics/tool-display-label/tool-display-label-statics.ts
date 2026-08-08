/**
 * PURPOSE: Pins how far a shell command is walked before the tool row stops reading it as a name.
 * The word cap is a legibility budget, not a parser bound — `npm run ward` earns three words,
 * `git diff --name-status <sha>..HEAD` earns two, and anything past that is argument detail the
 * summary slot already carries.
 *
 * USAGE:
 * toolDisplayLabelStatics.maxCommandWords;
 * // Returns 3
 */

export const toolDisplayLabelStatics = {
  maxCommandWords: 3,
  bashToolName: 'Bash',
  skillToolName: 'Skill',
  skillFieldKey: 'skill',
  commandFieldKey: 'command',
  unknownSkillLabel: 'unknown',
} as const;

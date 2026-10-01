/**
 * PURPOSE: Names the plain source file the pre-edit hook asks ESLint about BESIDE the edited one, to
 * tell a rule that is off everywhere (forced on, so new violations still block) from a rule a per-file
 * override switched off for this kind of file (left off, as ward leaves it). Reach for this through
 * violationsCheckNewBroker; the name only has to match no override glob, and is never written to disk.
 *
 * USAGE:
 * join(dirname(filePath), preEditReferenceStatics.file.name);
 * // Returns '<dir>/dungeonmaster-pre-edit-reference.ts'
 */

export const preEditReferenceStatics = {
  file: {
    name: 'dungeonmaster-pre-edit-reference.ts',
  },
} as const;

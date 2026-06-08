/**
 * PURPOSE: Caps how many implementation files (steps) a single Codeweaver work item owns.
 * Codeweaver is chunked one work item per package; a package with more than this many
 * implementation files is split into multiple codeweaver chunks.
 *
 * USAGE:
 * codeweaverMaxFilesPerChunkStatics.value;
 * // Returns 20
 */

export const codeweaverMaxFilesPerChunkStatics = {
  value: 20,
} as const;

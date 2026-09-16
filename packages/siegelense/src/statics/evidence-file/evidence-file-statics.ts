/**
 * PURPOSE: The filename fragments this package's own evidence files are built from — an
 * extension alone, or a bare prefix word, never a complete name by itself. These stay out of
 * `locationsStatics`: that file's `no-bare-location-literals` ban is repo-wide, so a fragment
 * landing there claims every OTHER package's unrelated use of the same extension or word the
 * moment it lands, rather than only this package's. The resolvers under
 * `brokers/locations/run-paths-find`, `.../shot-path-find` and `.../socket-path-find` are the
 * only readers — each concatenates one of these onto a run id, a step index or an instance id.
 *
 * USAGE:
 * evidenceFileStatics.extensions.transcript;
 * // Returns '.jsonl'
 *
 * evidenceFileStatics.naming.shotPrefix;
 * // Returns 'step'
 */

export const evidenceFileStatics = {
  extensions: {
    transcript: '.jsonl',
    runReturn: '.json',
    shot: '.png',
    socket: '.sock',
  },
  naming: {
    shotPrefix: 'step',
  },
} as const;

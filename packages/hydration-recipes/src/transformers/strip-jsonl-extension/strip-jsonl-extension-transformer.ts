/**
 * PURPOSE: Strips the trailing `.jsonl` extension off a filename, so a `query` route can turn a
 * directory entry's name back into the id it was written under. Reach for this over an inline
 * regex in a broker — `brokers/` forbids regex literals outright. The caller re-parses the result
 * through its own real id brand (`sessionIdContract`, `agentIdContract`); this returns the
 * generic stripped stem those two share.
 *
 * USAGE:
 * stripJsonlExtensionTransformer({ filename: 'seed-session-1.jsonl' });
 * // Returns 'seed-session-1' as a branded FileStem
 */

const JSONL_EXTENSION_PATTERN = /\.jsonl$/u;

export const stripJsonlExtensionTransformer = ({ filename }: { filename: string }): string =>
  filename.replace(JSONL_EXTENSION_PATTERN, '');

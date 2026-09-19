/**
 * PURPOSE: Answers whether a directory entry is a `.jsonl` file. Reach for this over an inline
 * regex in a broker — `brokers/` forbids regex literals outright, and this is the one check the
 * session and subagent `query` routes both need before treating an entry as a transcript.
 *
 * USAGE:
 * isJsonlFileGuard({ filename: 'seed-session-1.jsonl' });
 * // Returns true
 */
export const isJsonlFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  return filename.endsWith('.jsonl');
};

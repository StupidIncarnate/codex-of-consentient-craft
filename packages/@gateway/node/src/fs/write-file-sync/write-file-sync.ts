/**
 * PURPOSE: OUR guarded `fs.writeFileSync`: fixed UTF-8, and every OS error passed through
 * unchanged. Not atomic — a crash mid-write leaves a truncated file; use `writeFileAtomic`
 * from `#gateway/node/fs__promises` where a partial write is unacceptable.
 *
 * USAGE:
 * writeFileSync('/tmp/config.json', '{"a":1}');
 * // Writes the contents, replacing the file if it exists
 */
import { writeFileSync as nodeWriteFileSync } from 'fs';

export const writeFileSync = (path: string, contents: string): void => {
  nodeWriteFileSync(path, contents, 'utf8');
};

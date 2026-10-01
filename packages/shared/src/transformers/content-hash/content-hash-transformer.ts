/**
 * PURPOSE: The sha256 of a text, as lowercase hex — the key an index cache shard records per source
 * file, so an edit that keeps the file's size and mtime still reads as a change.
 *
 * USAGE:
 * contentHashTransformer({ text: 'export const a = 1;' });
 * // Returns the 64-character hex digest
 */
import { createHash } from '#gateway/node/crypto';

export const contentHashTransformer = ({ text }: { text: string }): string =>
  createHash('sha256').update(text).digest('hex');

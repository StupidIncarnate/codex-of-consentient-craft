/**
 * PURPOSE: Reads a whole file synchronously as raw bytes with no encoding applied. Reach for this
 * over readFileSync whenever raw bytes and exact byte lengths must round-trip losslessly without UTF-8
 * decoding/re-encoding corruption, or when computing binary checksums/hashes.
 *
 * USAGE:
 * const bytes = readFileBytesSync('/tmp/archive.tar');
 * // Returns the file's raw bytes as a Buffer
 */
import { readFileSync } from 'fs';

export const readFileBytesSync = (path: string): Buffer => readFileSync(path);

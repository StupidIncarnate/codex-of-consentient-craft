/**
 * PURPOSE: Closes an OS file descriptor `openForAppendSync` opened. A descriptor never closed
 * stays open for the life of the process, which is the kind of leak a long-running process
 * cannot afford to accumulate one instance at a time.
 *
 * USAGE:
 * closeSync(fd);
 * // Closes the descriptor
 */
import { closeSync as nodeCloseSync } from 'fs';

export const closeSync = (fd: number): void => {
  nodeCloseSync(fd);
};

/**
 * PURPOSE: Reports whether the process's stdin is attached to a terminal, read at call time.
 * Reach for this over `process.stdin.isTTY` directly so a caller can tell a person at a prompt
 * from a script or agent driving the process.
 *
 * USAGE:
 * const interactive = stdinIsTty();
 * // true only when process.stdin.isTTY is exactly true
 */

export const stdinIsTty = (): boolean => process.stdin.isTTY;

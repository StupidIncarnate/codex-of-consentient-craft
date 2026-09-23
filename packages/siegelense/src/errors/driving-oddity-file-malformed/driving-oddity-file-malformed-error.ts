/**
 * PURPOSE: Represents a committed driving-oddity file that is PRESENT but has a line that will not
 * parse as a `DrivingOddity`. Thrown rather than skipped, for the same reason
 * `SnapshotIndexUnreadableError` refuses to collapse "broken" into "empty": silently dropping the bad
 * line would answer "nothing odd here" while a walk's own correction sits unreadable on disk, and
 * every walk after it would trust that false silence. Names the 1-based line number AND the raw line
 * text, because "line 4" alone sends a reader back to open the file and count. `filePath`,
 * `lineNumber` and `line` are stored as `unknown`, matching `RefStaleError`: this file is a leaf node
 * (`errors/` imports nothing), so it cannot brand them through a contract.
 *
 * USAGE:
 * throw new DrivingOddityFileMalformedError({
 *   filePath: '/repo/.dungeonmaster-assets/driving-oddities.jsonl',
 *   lineNumber: 4,
 *   line: '{"key":"GUILD_ADD_MODAL"',
 *   cause: parseError,
 * });
 * // Throws error naming the file, the line number and the line's own text
 *
 * WHEN-TO-USE: A committed driving-oddity file exists on disk and one of its lines fails to parse as
 * JSON, or parses but fails `drivingOddityContract`.
 * WHEN-NOT-TO-USE: The file does not exist at all — that is read as an honestly empty list, never
 * this error.
 */
export class DrivingOddityFileMalformedError extends Error {
  public readonly filePath: unknown;

  public readonly lineNumber: unknown;

  public readonly line: unknown;

  public constructor({
    filePath,
    lineNumber,
    line,
    cause,
  }: {
    filePath: unknown;
    lineNumber: unknown;
    line: unknown;
    cause: unknown;
  }) {
    super(
      `Driving-oddity file at ${String(filePath)} has a line that will not parse — line ${String(lineNumber)}: ${String(line)}`,
      { cause },
    );
    this.filePath = filePath;
    this.lineNumber = lineNumber;
    this.line = line;
    this.name = 'DrivingOddityFileMalformedError';
  }
}

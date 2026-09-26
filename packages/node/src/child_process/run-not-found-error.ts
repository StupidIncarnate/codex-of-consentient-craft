/**
 * PURPOSE: Thrown by `run`/`runSync`/`stream`/`streamLines` when the OS never started `command` at
 * all — spawn's own `'error'` event (ENOENT, EACCES on the executable, …) — as opposed to a child
 * that started and exited non-zero on its own. Carries the failing `code` so a caller such as
 * `@dungeonmaster/bin/*` can recognize "the program isn't installed" by catching this class, instead
 * of pattern-matching an empty-output/exit-1 shape that an ordinary command failure can also produce.
 *
 * USAGE:
 * try {
 *   await run({ command: 'lsof', args, cwd });
 * } catch (error) {
 *   if (error instanceof RunNotFoundError) { ... }
 * }
 */

export class RunNotFoundError extends Error {
  public readonly command: string;
  public readonly code: string | undefined;

  public constructor({
    command,
    code,
    message,
  }: {
    command: string;
    code: string | undefined;
    message: string;
  }) {
    super(`"${command}" never started: ${message}`);
    this.command = command;
    this.code = code;
  }
}

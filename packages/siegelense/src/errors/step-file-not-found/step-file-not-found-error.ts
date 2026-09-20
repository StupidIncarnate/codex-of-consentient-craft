/**
 * PURPOSE: Represents an error when a `file` step attempts to read a file that does not exist in
 * the lane's throwaway home directory. Reach for this error specifically so the step dispatch layer
 * can distinguish a missing file from other filesystem or system errors — when expect: 'error' is
 * declared, this error is caught as an expected adversarial outcome (ok: true); otherwise it halts
 * the run batch with a clean finding (ok: false).
 *
 * USAGE:
 * throw new StepFileNotFoundError({ path: 'missing.json', homePath: '/tmp/lane-home' });
 * // Throws 'file "missing.json" does not exist in lane home "/tmp/lane-home"'
 */

export class StepFileNotFoundError extends Error {
  public readonly path: unknown;

  public readonly homePath: unknown;

  public constructor({ path, homePath }: { path: string; homePath: string }) {
    super(`file "${path}" does not exist in lane home "${homePath}"`);
    this.path = path;
    this.homePath = homePath;
    this.name = 'StepFileNotFoundError';
  }
}

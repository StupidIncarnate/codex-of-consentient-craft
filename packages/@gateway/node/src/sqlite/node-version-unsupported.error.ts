/**
 * PURPOSE: Thrown by openSqliteDatabase when the running Node version is older than 22.16.0.
 *
 * USAGE:
 * throw new NodeVersionUnsupportedError({ runningVersion: process.versions.node });
 */

export class NodeVersionUnsupportedError extends Error {
  public readonly runningVersion: string;

  public constructor({ runningVersion }: { runningVersion: string }) {
    super(`node:sqlite needs Node 22.16 or newer (running ${runningVersion})`);
    this.runningVersion = runningVersion;
  }
}

/**
 * PURPOSE: Represents an error when `registry.json` exists on disk but its content does not
 * parse. A missing file is a real, empty registry; a present-but-broken one is never allowed to
 * read the same way — collapsing the two would silently drop every instance the registry was
 * tracking. The path and the underlying parse failure are the whole story, so both are folded
 * into the message rather than stored on the instance.
 *
 * USAGE:
 * throw new RegistryUnreadableError({ registryPath: '/home/user/.dungeonmaster/siegelense/registry.json', cause });
 * // Throws error naming the exact path that failed to parse and the underlying parse failure
 *
 * WHEN-TO-USE: From the broker reading `registry.json` off disk, when the file is present but
 * `JSON.parse` or the registry contract's `.parse()` throws, so a caller can `instanceof`-check
 * it to distinguish "exists and is broken" from "does not exist yet".
 * WHEN-NOT-TO-USE: When `registry.json` is simply absent — that path returns `{ instances: [] }`
 * rather than throwing.
 */
export class RegistryUnreadableError extends Error {
  public constructor({ registryPath, cause }: { registryPath: string; cause: unknown }) {
    super(`Registry at ${registryPath} exists and could not be parsed: ${String(cause)}`);
    this.name = 'RegistryUnreadableError';
  }
}

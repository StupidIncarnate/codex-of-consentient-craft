/**
 * PURPOSE: Resolves the absolute path of tsx's CLI entry file. Reach for this to spawn
 * `node <cliPath> --conditions=source <script.ts>` directly, which skips `npx`'s own lookup and the
 * process it adds between the caller and the script. Resolved from this package's own location, so
 * it finds the copy this gateway declares as a dependency in a monorepo and in a consumer alike.
 *
 * USAGE:
 * const cli = tsxCliPath();
 * // Returns an absolute path such as /repo/node_modules/tsx/dist/cli.mjs; throws when tsx is not installed
 */

export const tsxCliPath = (): string => require.resolve('tsx/cli');

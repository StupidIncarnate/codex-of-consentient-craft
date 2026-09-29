/**
 * PURPOSE: Gateway entry for the npm package 'tsx'. tsx is a command-line tool, not a library a
 * caller imports, so nothing passes through; the one thing a caller needs from it is WHERE its CLI
 * lives, so it can run `node <cli> <script>` without going through `npx`.
 *
 * USAGE:
 * import { tsxCliPath } from '#gateway/npm/tsx';
 */

export { tsxCliPath } from './tsx-cli-path/tsx-cli-path';

/**
 * PURPOSE: Gateway entry for the npm package 'tsx'. tsx is a command-line tool, not a library a
 * caller imports, so nothing passes through; what a caller needs from it is WHERE its CLI and its loader
 * live, so it can run `node <cli> <script>` or `node --import <loader> <script>` without `npx`.
 *
 * USAGE:
 * import { tsxCliPath, tsxLoaderUrl } from '#gateway/npm/tsx';
 */

export { tsxCliPath } from './tsx-cli-path/tsx-cli-path';
export { tsxLoaderUrl } from './tsx-loader-url/tsx-loader-url';

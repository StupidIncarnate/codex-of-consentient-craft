/**
 * PURPOSE: NPM package import specifiers that identify a WebSocket-server adapter. The
 * project-map composer matches imports in adapter source files against this list to
 * recognize the file that wraps a WS-server library — generic across consumer repos
 * because it relies on what the adapter imports, not on adapter or package naming.
 *
 * USAGE:
 * import { wsServerNpmPackagesStatics } from './ws-server-npm-packages-statics';
 * for (const pkg of wsServerNpmPackagesStatics.npmPackages) {
 *   if (importSpecifier === pkg) { ... }
 * }
 *
 * WHEN-TO-USE: WS-gateway detection brokers. Extend by adding more specifiers when
 * a new WS-server library becomes relevant.
 */

export const wsServerNpmPackagesStatics = {
  npmPackages: ['@hono/node-ws', 'ws', 'socket.io', 'engine.io'],
} as const;

/**
 * PURPOSE: Curated entry for the Node built-in 'net'. Exposes port probing and a unix-socket
 * client/server pair, and nothing raw — every export here handles at least one sad path a bare
 * `net` call leaves uncaught.
 *
 * USAGE:
 * import { isPortFree, freePortPair, unixSocketRequest, unixSocketServe } from '@dungeonmaster/node/net';
 */

export { isPortFree } from './is-port-free';
export { freePortPair } from './free-port-pair';
export { unixSocketRequest } from './unix-socket-request';
export { unixSocketServe } from './unix-socket-serve';

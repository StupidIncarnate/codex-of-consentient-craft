/**
 * PURPOSE: Curated entry for the Node built-in 'net'. Exposes port probing and a unix-socket
 * client/server pair, and nothing raw — every export here handles at least one sad path a bare
 * `net` call leaves uncaught.
 *
 * USAGE:
 * import { isPortFree, freePortPair, unixSocketRequest, unixSocketServe } from '#gateway/node/net';
 */

export * from 'net';
export { freePortPair } from './free-port-pair/free-port-pair';
export { isPortFree } from './is-port-free/is-port-free';
export { unixSocketRequest } from './unix-socket-request/unix-socket-request';
export { unixSocketServe } from './unix-socket-serve/unix-socket-serve';

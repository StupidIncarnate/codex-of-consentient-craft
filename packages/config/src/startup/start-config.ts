/**
 * PURPOSE: The same-named sibling config's caller-facing proxy, `start-config.proxy.ts`, pairs with, and nothing else imports it.
 * enforce-proxy-child-creation demands the proxy compose the OWN proxy of any broker its sibling
 * imports by name; a bare re-export introduces no `import` line, so the pairing rule demands none, and
 * the proxy keeps mocking `configResolveBroker` alone rather than the internals beneath it.
 *
 * USAGE:
 * // A caller's proxy composes it per file:
 * import { configResolveBrokerProxy } from '@dungeonmaster/config/startup/start-config.proxy';
 */
export { configResolveBroker } from '../brokers/config/resolve/config-resolve-broker';

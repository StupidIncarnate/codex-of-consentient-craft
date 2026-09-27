/**
 * PURPOSE: Colocation anchor for config-resolve-caller.proxy.ts — never imported by anything else.
 * enforce-proxy-child-creation pairs a `.proxy.ts` file with a same-named sibling and, for a plain
 * `import {...} from` line in that sibling, unconditionally demands the imported broker's OWN
 * colocated proxy be composed as a child. Pairing the caller proxy with index.ts (where
 * configResolveBroker is genuinely imported by name) would demand composing
 * `brokers/config/resolve/config-resolve-broker.proxy.ts` — the internals-composing proxy F18
 * exists to stop other packages from reaching into (see config-resolve-caller.proxy.ts's own
 * header). A bare re-export (`export {x} from 'y'`) introduces no `import` line at all, so this
 * file gives the pairing rule nothing to demand.
 */
export { configResolveBroker } from './brokers/config/resolve/config-resolve-broker';

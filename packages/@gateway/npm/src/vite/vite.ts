/**
 * PURPOSE: Pass-through for the npm package 'vite''s types. Code outside the gateway names vite's
 * types through here instead of the raw package; its caller is a Vite config file, which types its
 * config object as `UserConfig` (what vite's own `defineConfig` identity function does).
 *
 * Types only, and `resolution-mode: import`: this gateway compiles as CommonJS, so plain 'vite'
 * resolves through the `require` condition to vite's deprecated CJS entry, typed `export = any`,
 * which a value `export *` refuses (TS2498) and which carries none of vite's declarations. A value
 * re-export would also load that deprecated CJS entry at runtime.
 *
 * USAGE:
 * import type { UserConfig } from '#gateway/npm/vite';
 */

export type * from 'vite' with { 'resolution-mode': 'import' };

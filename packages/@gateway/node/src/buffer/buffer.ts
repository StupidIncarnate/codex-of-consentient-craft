/**
 * PURPOSE: Pass-through for the Node built-in 'buffer', which is also where the `Buffer` global
 * comes from. There is no separate `Buffer` global subpath: `Buffer` and `buffer` differ only in
 * case, and TypeScript's `forceConsistentCasingInFileNames` (on repo-wide) refuses two sibling
 * folders whose names differ only by case — so a global exported by a same-named (ignoring case)
 * Node module is reached through that module's own pass-through instead.
 *
 * USAGE:
 * import { Buffer } from '#gateway/node/buffer';
 */

export * from 'buffer';

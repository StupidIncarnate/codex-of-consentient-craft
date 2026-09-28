/**
 * PURPOSE: The wrapper for eslint's `ESLint` class — the one place a caller's `new ESLint(...)` is
 * routed through, so a future guard on construction lands here and reaches every caller. The barrel
 * (`../eslint.ts`) re-exports it by name, which is what makes it a WRAPPED export with its own proxy
 * instead of a pass-through. A subclass rather than a re-export: the shape the gateway's colocation
 * check counts as "this file exports ESLint", and every static and instance method is inherited.
 *
 * USAGE:
 * import { ESLint } from '#gateway/npm/eslint';
 * const results = await new ESLint({ cwd }).lintText(text, { filePath });
 */
import { ESLint as PackageESLint } from 'eslint';

export class ESLint extends PackageESLint {}

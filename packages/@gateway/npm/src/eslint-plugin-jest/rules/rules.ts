/**
 * PURPOSE: The `rules` export of eslint-plugin-jest, in its own wrapper so the package's module
 * mock has one proxy to live in (`rules.proxy.ts`). Import `rules` from the subpath barrel, not from here.
 *
 * USAGE:
 * import { rules } from '#gateway/npm/eslint-plugin-jest';
 */
import { rules as packageRules } from 'eslint-plugin-jest';

export const rules = packageRules;

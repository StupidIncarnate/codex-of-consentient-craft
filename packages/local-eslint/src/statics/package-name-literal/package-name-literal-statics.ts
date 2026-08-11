/**
 * PURPOSE: Configuration knobs for the no-hardcoded-package-names rule — the role-bearing name set the rule watches for, the workspace directory names that make a name path-shaped, the equality operators that turn a bare name into a branch, and the path allowlists.
 *
 * USAGE:
 * import { packageNameLiteralStatics } from './statics/package-name-literal/package-name-literal-statics';
 * packageNameLiteralStatics.roleBearingPackageNames;
 * // Returns the readonly name list the rule matches after a workspace directory segment
 *
 * WHEN-TO-USE: Only the no-hardcoded-package-names rule should consume this. Application code that needs to know what kind of package it is resolves `packageType` from disk instead.
 */
export const packageNameLiteralStatics = {
  // Names that carry a frontend/backend ROLE. These are the names a session reaches for when it
  // means "the UI" or "the API", and the ones a different repo will spell differently — or carry
  // several of. Names with no role in them (`shared`, `tooling`, an app's own domain package) are
  // deliberately absent: renaming those is a portability question, not the standing constraint.
  roleBearingPackageNames: ['web', 'ui', 'frontend', 'client', 'app', 'server', 'backend', 'api'],
  // Directory segments a workspace root uses. A name only counts as hardcoded when it follows one
  // of these, so `@dungeonmaster/web` (a module specifier) and the bare word `web` in prose stay
  // clear of the rule.
  workspaceDirNames: ['packages'],
  // Operators that turn a bare role name into a branch. A name compared with one of these is a
  // decision; the same name as an array member or an enum option is data.
  equalityOperators: ['===', '!==', '==', '!='],
  // Path substrings whose files may carry these names as data — the rule's own home, which has to
  // spell them out to match them.
  allowlistPathSubstrings: ['/packages/local-eslint/src/'],
  // Path regex fragments — files matching are tests/stubs/proxies/harnesses, where a real repo path
  // is fixture data rather than a decision the shipped system makes.
  allowlistPathRegexSources: [
    '\\.test\\.ts$',
    '\\.test\\.tsx$',
    '\\.integration\\.test\\.ts$',
    '\\.integration\\.test\\.tsx$',
    '\\.e2e\\.ts$',
    '\\.e2e\\.test\\.ts$',
    '\\.e2e\\.test\\.tsx$',
    '\\.stub\\.ts$',
    '\\.stub\\.tsx$',
    '\\.proxy\\.ts$',
    '\\.proxy\\.tsx$',
    '\\.harness\\.ts$',
  ],
} as const;

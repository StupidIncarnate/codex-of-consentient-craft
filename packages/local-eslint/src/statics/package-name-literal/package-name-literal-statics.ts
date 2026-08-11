/**
 * PURPOSE: Configuration knobs for the no-hardcoded-package-names rule — the role-bearing name set the rule watches for, the workspace directory names that make a name path-shaped, the operators and collection methods that turn a bare name into a branch, and the path allowlists.
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
  // several of. `desktop` is here because an Electron shell IS a UI surface, so the same
  // "is this the frontend" branch reaches for it. Names with no role in them (`shared`, `tooling`,
  // `core`, an app's own domain package) are deliberately absent: renaming those is a portability
  // question, not the standing constraint, and each is a common enough English word that watching
  // it would report far more prose than decisions.
  roleBearingPackageNames: [
    'web',
    'ui',
    'frontend',
    'client',
    'app',
    'desktop',
    'server',
    'backend',
    'api',
  ],
  // Directory segments a workspace root uses. A name only counts as hardcoded when it follows one
  // of these, so `@dungeonmaster/web` (a module specifier) and the bare word `web` in prose stay
  // clear of the rule.
  workspaceDirNames: ['packages', 'apps', 'libs'],
  // Operators that turn a bare role name into a branch. A name compared with one of these is a
  // decision; the same name as an enum option or a display label is data.
  equalityOperators: ['===', '!==', '==', '!='],
  // Methods that ask a collection "is this one of you?" by taking the CANDIDATE VALUE. An array of
  // bare role names reaching one of these is the set-shaped spelling of the branch `===` makes —
  // `UI.includes(pkg)` is `pkg === 'web' || pkg === 'app'` with the operands moved.
  //
  // The predicate methods (`some`, `every`, `find`, `filter`) are deliberately absent even though
  // `NAMES.some((n) => n === pkg)` is the same decision: their argument is a callback that can ask
  // anything, so watching them reports every list that merely happens to contain one of these
  // words — `skipPrefixes.every((p) => !segment.startsWith(p))` over `[':', 'api']` is a URL scan,
  // not a package branch. Taking the value is what makes the test unambiguous.
  membershipTestMethodNames: ['includes', 'indexOf', 'lastIndexOf'],
  // Constructors whose whole purpose is membership, so building one out of role names is the
  // decision even when the `.has()` call sits somewhere this rule cannot follow it to.
  membershipSetConstructorNames: ['Set'],
  // Node types that wrap an expression without changing what it is, so the position that decides
  // whether a value is a branch or data sits one level further out.
  transparentExpressionWrapperTypes: [
    'TSAsExpression',
    'TSSatisfiesExpression',
    'TSNonNullExpression',
  ],
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

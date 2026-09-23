/**
 * PURPOSE: Adds `.dungeonmaster-assets/siegelense-assets` to the target repo's `.gitignore`, and
 * beside `worktrees` in every config surface that already excludes it: eslint's `ignores` array,
 * `tsconfig.json`'s `exclude` array, and a root jest config's `testPathIgnorePatterns` array. A
 * symlinked directory of thousands of PNGs is something ESLint's whole-tree walk, tsc's program and
 * jest's test-path scan can all walk into in a CONSUMER repo, even where none of them do in this one.
 * Mirrors `@dungeonmaster/orchestrator`'s install-repo-scaffold-responder for the `.gitignore` half:
 * append-only, matched on the WHOLE line so a substring hit (`.claude/worktrees`) is never read as
 * a match. `tsconfig.json` is read and rewritten as TEXT LINES, never `JSON.parse`/`JSON.stringify`
 * — this repo's own tsconfig.json family permits comments, and a parse/stringify round-trip would
 * silently drop them and reformat the whole file for one inserted line.
 *
 * The gitignore entry is the CHILD path, `.dungeonmaster-assets/siegelense-assets`, never the bare
 * `.dungeonmaster-assets` parent: a committed oddities file lives directly in that parent, so a
 * pattern that ignores the parent would hide a tracked file from git. This responder only ever
 * checks for and writes its OWN exact entry — a consumer's `.gitignore` that already carries an
 * unrelated `.dungeonmaster-assets` line, for whatever reason, is left exactly as it is.
 *
 * The gitignore entry carries NO trailing slash. A trailing slash means "directory only" to git,
 * and `siegelense-assets` is a SYMLINK — git never treats a symlink as a directory, even one
 * pointing at one, so a slash-suffixed pattern never matches it (confirmed live, before the path
 * nested under `.dungeonmaster-assets/`: `git check-ignore -v .siegelense` exits 1 against
 * `.siegelense/` and exits 0 against bare `.siegelense`; the same rule holds for the nested path).
 * A repo whose `.gitignore` still carries the entry from BEFORE this path nested — bare
 * `.siegelense`, or the already-broken `.siegelense/` — gets that line REPLACED in place with the
 * working nested pattern, rather than left dead beside a second, working line.
 *
 * USAGE:
 * const result = await InstallIgnoreWriteResponder({ context });
 * // Appends `.dungeonmaster-assets/siegelense-assets` to .gitignore when missing (replacing a
 * // legacy `.siegelense` or `.siegelense/` line in place if one is there), and inserts a
 * // `siegelense-assets` entry — shaped like its `worktrees` neighbour (bare, trailing-slash, or
 * // `/**`) — beside `worktrees` in eslint.config.*, tsconfig.json and jest.config.{js,cjs}, each
 * // only when that file already excludes `worktrees` and does not yet exclude `siegelense-assets`
 */

import { fsExistsSyncAdapter, pathResolveAdapter } from '@dungeonmaster/shared/adapters';
import {
  type InstallContext,
  type InstallResult,
  fileContentsContract,
  filePathContract,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { ArrayEntryAnchorInsertLayerResponder } from './array-entry-anchor-insert-layer-responder';

const PACKAGE_NAME = '@dungeonmaster/siegelense';
const GITIGNORE_FILENAME = '.gitignore';
// The CHILD path, scoped under the parent — no trailing slash. See the file header: a trailing
// slash means "directory only" to git and never matches the `siegelense-assets` symlink; the bare
// parent alone would hide the committed oddities file that lives directly inside it.
const SIEGELENSE_GITIGNORE_ENTRY = `${locationsStatics.repoRoot.dungeonmasterAssets}/${locationsStatics.repoRoot.siegelenseLink}`;
// Two shapes an install wrote before this path nested under `.dungeonmaster-assets/` — bare (the
// working shape at the time) and trailing-slash (an earlier, broken write that never matched the
// symlink at all). Neither exists in locationsStatics any more, so both are held here as their own
// literals; a `.gitignore` still carrying either gets it replaced with SIEGELENSE_GITIGNORE_ENTRY
// rather than left in place beside a second, working line.
const SIEGELENSE_GITIGNORE_LEGACY_ENTRY = '.siegelense';
const SIEGELENSE_GITIGNORE_LEGACY_SLASH_ENTRY = '.siegelense/';

// A repo may name its jest config `.js` or `.cjs` — this repo alone has packages using both — and
// locationsStatics carries no jest-config-filename entry to reuse (unlike tsconfig.json, which
// does: locationsStatics.repoRoot.tsconfig). Kept as two named literals, combined inline at the
// call site, rather than one array const: `@dungeonmaster/enforce-magic-arrays` requires a
// standalone string-literal array to live in a statics file, and this pair is used nowhere else.
const JEST_CONFIG_JS_FILENAME = 'jest.config.js';
const JEST_CONFIG_CJS_FILENAME = 'jest.config.cjs';

// eslint `ignores` and tsconfig `exclude` are GLOB arrays; the three shapes a directory entry
// takes there are bare, trailing-slash, and `/**` — this repo's own eslint.config.js uses `/**`
// for `worktrees`.
const WORKTREES_GLOB_VALUES = [
  locationsStatics.repoRoot.worktreesDir,
  `${locationsStatics.repoRoot.worktreesDir}/`,
  `${locationsStatics.repoRoot.worktreesDir}/**`,
];
const SIEGELENSE_GLOB_VALUES = [
  locationsStatics.repoRoot.siegelenseLink,
  `${locationsStatics.repoRoot.siegelenseLink}/`,
  `${locationsStatics.repoRoot.siegelenseLink}/**`,
];

// jest's `testPathIgnorePatterns` entries are REGEX strings (jest wraps each one in
// `new RegExp(...)`), not globs, so this repo's own jest.config.base.js wraps a directory name in
// slashes — `/node_modules/`, `/dist/` — instead of a glob's `/**` suffix.
const WORKTREES_REGEX_VALUES = [
  locationsStatics.repoRoot.worktreesDir,
  `${locationsStatics.repoRoot.worktreesDir}/`,
  `/${locationsStatics.repoRoot.worktreesDir}/`,
];
const SIEGELENSE_REGEX_VALUES = [
  locationsStatics.repoRoot.siegelenseLink,
  `${locationsStatics.repoRoot.siegelenseLink}/`,
  `/${locationsStatics.repoRoot.siegelenseLink}/`,
];

export const InstallIgnoreWriteResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const gitignorePath = pathResolveAdapter({
    paths: [context.targetProjectRoot, GITIGNORE_FILENAME],
  });
  const gitignorePresent = fsExistsSyncAdapter({
    filePath: filePathContract.parse(gitignorePath),
  });
  const existingGitignore = gitignorePresent
    ? String(await fsReadFileAdapter({ filePath: gitignorePath }))
    : '';

  // trimEnd, never trim — see install-repo-scaffold-responder.ts: git strips TRAILING pattern
  // whitespace but treats LEADING whitespace as part of the pattern.
  const gitignoreLines = existingGitignore.split('\n').map((line) => line.trimEnd());
  const gitignoreHasEntry = gitignoreLines.includes(SIEGELENSE_GITIGNORE_ENTRY);
  const staleEntryLineIndex = gitignoreLines.findIndex(
    (line) =>
      line === SIEGELENSE_GITIGNORE_LEGACY_ENTRY ||
      line === SIEGELENSE_GITIGNORE_LEGACY_SLASH_ENTRY,
  );
  // `gitignoreLines[-1]` is `undefined` at runtime exactly when nothing matched, so this alone
  // both narrows the type below and answers "is there a stale line" — no separate boolean needed.
  const staleEntryLine = gitignoreLines[staleEntryLineIndex];

  if (!gitignoreHasEntry) {
    const newGitignore =
      staleEntryLine === undefined
        ? existingGitignore
          ? `${existingGitignore.trimEnd()}\n${SIEGELENSE_GITIGNORE_ENTRY}\n`
          : `${SIEGELENSE_GITIGNORE_ENTRY}\n`
        : gitignoreLines
            .map((line, index) =>
              index === staleEntryLineIndex ? SIEGELENSE_GITIGNORE_ENTRY : line,
            )
            .join('\n');
    await fsWriteFileAdapter({
      filePath: gitignorePath,
      contents: fileContentsContract.parse(newGitignore),
    });
  }

  const gitignoreClause = gitignoreHasEntry
    ? `${SIEGELENSE_GITIGNORE_ENTRY} already in ${GITIGNORE_FILENAME}`
    : staleEntryLine === undefined
      ? gitignorePresent
        ? `Added ${SIEGELENSE_GITIGNORE_ENTRY} to existing ${GITIGNORE_FILENAME}`
        : `Created ${GITIGNORE_FILENAME} with ${SIEGELENSE_GITIGNORE_ENTRY}`
      : `Replaced stale ${staleEntryLine} with ${SIEGELENSE_GITIGNORE_ENTRY} in ${GITIGNORE_FILENAME}`;

  const clauses = [gitignoreClause];
  let anySurfaceWritten = false;

  // A repo may name its eslint config any of these four ways; the first one found on disk is the
  // one this repo actually uses.
  const eslintConfigPath = locationsStatics.repoRoot.eslintConfig
    .map((candidateName) =>
      pathResolveAdapter({ paths: [context.targetProjectRoot, candidateName] }),
    )
    .find((candidatePath) =>
      fsExistsSyncAdapter({ filePath: filePathContract.parse(candidatePath) }),
    );

  if (eslintConfigPath !== undefined) {
    const eslintContent = String(await fsReadFileAdapter({ filePath: eslintConfigPath }));
    const eslintResult = ArrayEntryAnchorInsertLayerResponder({
      content: eslintContent,
      anchorValueCandidates: WORKTREES_GLOB_VALUES,
      entryValueCandidates: SIEGELENSE_GLOB_VALUES,
    });

    if (eslintResult.inserted) {
      await fsWriteFileAdapter({ filePath: eslintConfigPath, contents: eslintResult.content });
      clauses.push(`Added ${eslintResult.matchedEntryValue} to eslint ignores`);
      anySurfaceWritten = true;
    } else if (eslintResult.alreadyPresent) {
      clauses.push(`${eslintResult.matchedEntryValue} already in eslint ignores`);
    }
    // Neither branch: this config does not exclude `worktrees` either, so there is nowhere for
    // `siegelense-assets` to sit beside — quietly skipped, no clause. Same gate as tsconfig and
    // jest below: a repo that does not exclude `worktrees` gets no edit, and that is the correct
    // outcome, not a failure.
  }

  // tsconfig.json is a SINGLE canonical name — locationsStatics already carries it.
  const tsconfigPath = pathResolveAdapter({
    paths: [context.targetProjectRoot, locationsStatics.repoRoot.tsconfig],
  });
  const tsconfigPresent = fsExistsSyncAdapter({ filePath: filePathContract.parse(tsconfigPath) });

  if (tsconfigPresent) {
    const tsconfigContent = String(await fsReadFileAdapter({ filePath: tsconfigPath }));
    const tsconfigResult = ArrayEntryAnchorInsertLayerResponder({
      content: tsconfigContent,
      anchorValueCandidates: WORKTREES_GLOB_VALUES,
      entryValueCandidates: SIEGELENSE_GLOB_VALUES,
    });

    if (tsconfigResult.inserted) {
      await fsWriteFileAdapter({ filePath: tsconfigPath, contents: tsconfigResult.content });
      clauses.push(`Added ${tsconfigResult.matchedEntryValue} to tsconfig exclude`);
      anySurfaceWritten = true;
    } else if (tsconfigResult.alreadyPresent) {
      clauses.push(`${tsconfigResult.matchedEntryValue} already in tsconfig exclude`);
    }
  }

  const jestConfigPath = [JEST_CONFIG_JS_FILENAME, JEST_CONFIG_CJS_FILENAME]
    .map((candidateName) =>
      pathResolveAdapter({ paths: [context.targetProjectRoot, candidateName] }),
    )
    .find((candidatePath) =>
      fsExistsSyncAdapter({ filePath: filePathContract.parse(candidatePath) }),
    );

  if (jestConfigPath !== undefined) {
    const jestContent = String(await fsReadFileAdapter({ filePath: jestConfigPath }));
    const jestResult = ArrayEntryAnchorInsertLayerResponder({
      content: jestContent,
      anchorValueCandidates: WORKTREES_REGEX_VALUES,
      entryValueCandidates: SIEGELENSE_REGEX_VALUES,
    });

    if (jestResult.inserted) {
      await fsWriteFileAdapter({ filePath: jestConfigPath, contents: jestResult.content });
      clauses.push(`Added ${jestResult.matchedEntryValue} to jest testPathIgnorePatterns`);
      anySurfaceWritten = true;
    } else if (jestResult.alreadyPresent) {
      clauses.push(`${jestResult.matchedEntryValue} already in jest testPathIgnorePatterns`);
    }
  }

  const gitignoreWritten = !gitignoreHasEntry;
  const anyWritten = gitignoreWritten || anySurfaceWritten;
  const gitignoreNewlyCreated = gitignoreWritten && !gitignorePresent;

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: anyWritten ? (gitignoreNewlyCreated ? 'created' : 'merged') : 'skipped',
    message: installMessageContract.parse(clauses.join('; ')),
  };
};

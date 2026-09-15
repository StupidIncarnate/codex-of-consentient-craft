/**
 * PURPOSE: Adds `.siegelense` to the target repo's `.gitignore`, and beside `worktrees` in every
 * config surface that already excludes it: eslint's `ignores` array, `tsconfig.json`'s `exclude`
 * array, and a root jest config's `testPathIgnorePatterns` array. A symlinked directory of
 * thousands of PNGs is something ESLint's whole-tree walk, tsc's program and jest's test-path scan
 * can all walk into in a CONSUMER repo, even where none of them do in this one. Mirrors
 * `@dungeonmaster/orchestrator`'s install-repo-scaffold-responder for the `.gitignore` half:
 * append-only, matched on the WHOLE line so a substring hit (`.claude/worktrees`) is never read as
 * a match. `tsconfig.json` is read and rewritten as TEXT LINES, never `JSON.parse`/`JSON.stringify`
 * — this repo's own tsconfig.json family permits comments, and a parse/stringify round-trip would
 * silently drop them and reformat the whole file for one inserted line.
 *
 * USAGE:
 * const result = await InstallIgnoreWriteResponder({ context });
 * // Appends `.siegelense/` to .gitignore when missing, and inserts a `.siegelense` entry beside
 * // `worktrees` in eslint.config.*, tsconfig.json and jest.config.{js,cjs} — each only when that
 * // file already excludes `worktrees` and does not yet exclude `.siegelense`
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
const SIEGELENSE_GITIGNORE_ENTRY = `${locationsStatics.repoRoot.siegelenseLink}/`;

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
const SIEGELENSE_GLOB_ENTRY = `${locationsStatics.repoRoot.siegelenseLink}/**`;

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
const SIEGELENSE_REGEX_ENTRY = `/${locationsStatics.repoRoot.siegelenseLink}/`;

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
  const gitignoreHasEntry =
    gitignoreLines.includes(SIEGELENSE_GITIGNORE_ENTRY) ||
    gitignoreLines.includes(locationsStatics.repoRoot.siegelenseLink);

  if (!gitignoreHasEntry) {
    const appended = `${SIEGELENSE_GITIGNORE_ENTRY}\n`;
    const newGitignore = existingGitignore
      ? `${existingGitignore.trimEnd()}\n${appended}`
      : appended;
    await fsWriteFileAdapter({
      filePath: gitignorePath,
      contents: fileContentsContract.parse(newGitignore),
    });
  }

  const gitignoreClause = gitignoreHasEntry
    ? `${SIEGELENSE_GITIGNORE_ENTRY} already in ${GITIGNORE_FILENAME}`
    : gitignorePresent
      ? `Added ${SIEGELENSE_GITIGNORE_ENTRY} to existing ${GITIGNORE_FILENAME}`
      : `Created ${GITIGNORE_FILENAME} with ${SIEGELENSE_GITIGNORE_ENTRY}`;

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
      newEntryValue: SIEGELENSE_GLOB_ENTRY,
    });

    if (eslintResult.inserted) {
      await fsWriteFileAdapter({ filePath: eslintConfigPath, contents: eslintResult.content });
      clauses.push(`Added ${SIEGELENSE_GLOB_ENTRY} to eslint ignores`);
      anySurfaceWritten = true;
    } else if (eslintResult.alreadyPresent) {
      clauses.push(`${SIEGELENSE_GLOB_ENTRY} already in eslint ignores`);
    }
    // Neither branch: this config does not exclude `worktrees` either, so there is nowhere for
    // `.siegelense` to sit beside — quietly skipped, no clause. Same gate as tsconfig and jest
    // below: a repo that does not exclude `worktrees` gets no edit, and that is the correct
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
      newEntryValue: SIEGELENSE_GLOB_ENTRY,
    });

    if (tsconfigResult.inserted) {
      await fsWriteFileAdapter({ filePath: tsconfigPath, contents: tsconfigResult.content });
      clauses.push(`Added ${SIEGELENSE_GLOB_ENTRY} to tsconfig exclude`);
      anySurfaceWritten = true;
    } else if (tsconfigResult.alreadyPresent) {
      clauses.push(`${SIEGELENSE_GLOB_ENTRY} already in tsconfig exclude`);
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
      newEntryValue: SIEGELENSE_REGEX_ENTRY,
    });

    if (jestResult.inserted) {
      await fsWriteFileAdapter({ filePath: jestConfigPath, contents: jestResult.content });
      clauses.push(`Added ${SIEGELENSE_REGEX_ENTRY} to jest testPathIgnorePatterns`);
      anySurfaceWritten = true;
    } else if (jestResult.alreadyPresent) {
      clauses.push(`${SIEGELENSE_REGEX_ENTRY} already in jest testPathIgnorePatterns`);
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

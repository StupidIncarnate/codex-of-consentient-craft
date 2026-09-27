/**
 * Classifies a consumer's `eslint --format json` result for `packages/@gateway/node` against unit
 * **F1** (EPIC.md): a real consumer resolves a newer `@typescript-eslint` (8.70.x, against this
 * checkout's pinned 8.35.1-8.45.0 peer range) than this repo's own lint ever runs under, and that
 * newer version reports two rules this repo's build has never seen fire here: `no-unused-vars` on
 * an imported TYPE that a proxy uses only inside `as unknown as X`, and `no-deprecated` on
 * `util.types.isNativeError`. Both are real newer-linter findings, not this suite's bug — F1 is
 * recorded as `not yours to fix` in EPIC.md, so this file's job is to assert the failure is EXACTLY
 * this known shape, not silently swallow it: an eslint run over `@gateway/node` reporting anything
 * OUTSIDE this file+rule set is a NEW regression this suite must still catch.
 */

import { relative, sep } from 'node:path';

export const KNOWN_F1_RULE_IDS = [
  '@typescript-eslint/no-unused-vars',
  '@typescript-eslint/no-deprecated',
];

export const KNOWN_F1_RELATIVE_FILES = [
  'src/child_process/spawn-detached/spawn-detached.proxy.ts',
  'src/fetch/fetch-ok/fetch-ok.ts',
  'src/fs/tail-file/tail-file.proxy.ts',
  'src/fs__promises/disk-free-bytes/disk-free-bytes.proxy.ts',
  'src/fs__promises/stat-if-exists/stat-if-exists.proxy.ts',
  'src/fs__promises/stat/stat.proxy.ts',
];

const toPosixRelative = ({ packageRoot, filePath }) =>
  relative(packageRoot, filePath).split(sep).join('/');

export const classifyGatewayNodeLintResult = ({ eslintJson, packageRoot }) => {
  const filesWithErrors = eslintJson.filter((entry) => entry.errorCount > 0);
  const unexpectedFiles = [];
  const unexpectedRules = [];

  for (const fileResult of filesWithErrors) {
    const relativePath = toPosixRelative({ packageRoot, filePath: fileResult.filePath });
    if (!KNOWN_F1_RELATIVE_FILES.includes(relativePath)) {
      unexpectedFiles.push(relativePath);
    }
    for (const message of fileResult.messages) {
      if (message.severity === 2 && !KNOWN_F1_RULE_IDS.includes(message.ruleId)) {
        unexpectedRules.push({ relativePath, ruleId: message.ruleId });
      }
    }
  }

  return {
    failingFileCount: filesWithErrors.length,
    unexpectedFiles,
    unexpectedRules,
    matchesKnownF1Only:
      filesWithErrors.length > 0 && unexpectedFiles.length === 0 && unexpectedRules.length === 0,
  };
};

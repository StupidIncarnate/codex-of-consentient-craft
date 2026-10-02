/**
 * PURPOSE: Flags an import of `questRepoRootBroker` outside the files that may name the main
 * checkout. Quest work after the carve belongs in the quest's worktree, and `questRepoRootBroker`
 * always answers with the main checkout, so a caller that reaches for it acts on master's files.
 *
 * USAGE:
 * const rule = ruleEnforceQuestCwdResolveBroker();
 * // Returns ESLint rule that flags `import { questRepoRootBroker } from '...'` in
 * // quest-modify-broker.ts and stays silent in quest-cwd-resolve-broker.ts
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint (this repo only, never shipped). Matches
 * the imported binding name, so an alias or a barrel path is still caught.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { enforceQuestCwdResolveStatics } from '../../../statics/enforce-quest-cwd-resolve/enforce-quest-cwd-resolve-statics';

export const ruleEnforceQuestCwdResolveBroker = (): TSESLint.RuleModule<'questRepoRootImport'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban importing questRepoRootBroker outside its allowlist; quest work after the carve uses questCwdResolveBroker.',
    },
    messages: {
      questRepoRootImport:
        "questRepoRootBroker is the main checkout. Quest work after the carve belongs in the quest's worktree: use questCwdResolveBroker, which returns the worktree once carved and the repo root before.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]>;
    const { filename } = ctx;
    const { allowedPathFragments, exemptFileSuffixes, bannedImportName } =
      enforceQuestCwdResolveStatics;

    const isExempt =
      exemptFileSuffixes.some((suffix) => filename.endsWith(suffix)) ||
      allowedPathFragments.some((fragment) => filename.includes(fragment));
    if (isExempt) {
      return {};
    }

    return {
      ImportSpecifier: (node: TSESTree.ImportSpecifier): void => {
        if (
          node.imported.type === AST_NODE_TYPES.Identifier &&
          node.imported.name === bannedImportName
        ) {
          ctx.report({ node, messageId: 'questRepoRootImport' });
        }
      },
    };
  },
});

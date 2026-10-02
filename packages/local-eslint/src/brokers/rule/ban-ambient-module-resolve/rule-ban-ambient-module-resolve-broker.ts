/**
 * PURPOSE: Flags every `require.resolve(...)` call in production code. It answers where THIS
 * process is installed, which inside the server is the main checkout and never the quest's
 * worktree. `moduleResolveBroker` in @dungeonmaster/shared is the one file allowed to call it.
 *
 * USAGE:
 * const rule = ruleBanAmbientModuleResolveBroker();
 * // Returns ESLint rule that flags `require.resolve('@dungeonmaster/cli')` and stays silent on
 * // `require('x')` and `foo.resolve()`
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint (this repo only, never shipped). Test,
 * proxy, stub and harness files, the gateway packages and the sanctioned broker are exempt.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isBanAmbientModuleResolveExemptFileGuard } from '../../../guards/is-ban-ambient-module-resolve-exempt-file/is-ban-ambient-module-resolve-exempt-file-guard';

export const ruleBanAmbientModuleResolveBroker =
  (): TSESLint.RuleModule<'ambientModuleResolve'> => ({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban require.resolve in production code: it answers where this process is installed, not where the run's repo is.",
      },
      messages: {
        ambientModuleResolve:
          "require.resolve answers where THIS process is installed — inside the server that is the main checkout, not the quest's worktree. Resolve through moduleResolveBroker({ specifier, repoRoot }) from @dungeonmaster/shared/brokers with the run's repo root.",
      },
      schema: [],
    },
    defaultOptions: [],
    create: (context: unknown) => {
      const ctx = context as TSESLint.RuleContext<string, unknown[]>;
      if (isBanAmbientModuleResolveExemptFileGuard({ filename: ctx.filename })) {
        return {};
      }

      return {
        CallExpression: (node: TSESTree.CallExpression): void => {
          const { callee } = node;
          if (
            callee.type === AST_NODE_TYPES.MemberExpression &&
            !callee.computed &&
            callee.object.type === AST_NODE_TYPES.Identifier &&
            callee.object.name === 'require' &&
            callee.property.type === AST_NODE_TYPES.Identifier &&
            callee.property.name === 'resolve'
          ) {
            ctx.report({ node, messageId: 'ambientModuleResolve' });
          }
        },
      };
    },
  });

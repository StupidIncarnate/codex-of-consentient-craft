/**
 * PURPOSE: Bans `process.cwd()` and calls of the gateway process wrapper's `cwd` outside the entry layer (startup/, responders/) and the wrapper itself, so a broker takes its location as a parameter
 *
 * USAGE:
 * const rule = ruleNoBareProcessCwdBroker();
 * // Returns ESLint rule that flags process.cwd() except in allowed files/folders/test files
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent cwd-as-target bugs (wrong cwd at spawn time, install scripts run from sub-package, hook payload trusted blindly, etc.)
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import { isGatewayCwdCallGuard } from '../../../guards/is-gateway-cwd-call/is-gateway-cwd-call-guard';
import { isProcessCwdCallGuard } from '../../../guards/is-process-cwd-call/is-process-cwd-call-guard';
import { isHarnessOrProxyFileGuard } from '../../../guards/is-harness-or-proxy-file/is-harness-or-proxy-file-guard';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { filePathToCwdRelativeTransformer } from '../../../transformers/file-path-to-cwd-relative/file-path-to-cwd-relative-transformer';
import { minimatch } from '#gateway/npm/minimatch';
import { noBareProcessCwdStatics } from '../../../statics/no-bare-process-cwd/no-bare-process-cwd-statics';

export const ruleNoBareProcessCwdBroker = (): TSESLint.RuleModule<'bareProcessCwd'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban process.cwd() and a cwd() imported from the gateway process wrapper outside the entry layer (startup/, responders/). The entry layer reads where it runs and passes a repo root down.',
    },
    messages: {
      bareProcessCwd:
        'Reading the ambient cwd belongs to the entry layer (startup/, responders/): it reads where it runs and passes a repo root down. Take the location as a required parameter, and for quest work get it from questCwdResolveBroker.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedFiles: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Glob patterns (relative to cwd) for files where process.cwd() is allowed.',
          },
          allowedFolders: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Glob patterns (relative to cwd) for folders where process.cwd() is allowed.',
          },
          allowTestFiles: {
            type: 'boolean',
            description:
              'When true (default), automatically allows process.cwd() in *.test.ts, *.integration.test.ts, *.harness.ts, *.proxy.ts files.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
      cwd?: string;
      options?: {
        allowedFiles?: readonly string[];
        allowedFolders?: readonly string[];
        allowTestFiles?: boolean;
      }[];
    };
    const { filename } = ctx;
    const { cwd } = ctx;
    const options = ctx.options[0] ?? {};
    const allowedFiles = options.allowedFiles ?? noBareProcessCwdStatics.defaults.allowedFiles;
    const allowedFolders =
      options.allowedFolders ?? noBareProcessCwdStatics.defaults.allowedFolders;
    const allowTestFiles =
      options.allowTestFiles ?? noBareProcessCwdStatics.defaults.allowTestFiles;

    if (
      allowTestFiles &&
      (isTestFileGuard({ filename }) || isHarnessOrProxyFileGuard({ filename }))
    ) {
      return {};
    }

    const relativePath = filePathToCwdRelativeTransformer({ filename, cwd });
    const allMatchPatterns = [...allowedFiles, ...allowedFolders];
    const isAllowed = allMatchPatterns.some(
      (pattern) =>
        minimatch(relativePath, pattern, { dot: true }) ||
        minimatch(filename, pattern, { dot: true }),
    );
    if (isAllowed) {
      return {};
    }

    const cwdLocalNames = new Set<string>();
    const namespaceLocalNames = new Set<string>();

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        if (node.source.value !== noBareProcessCwdStatics.gateway.processModule) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
            namespaceLocalNames.add(specifier.local.name);
          }
          if (
            specifier.type === AST_NODE_TYPES.ImportSpecifier &&
            specifier.imported.type === AST_NODE_TYPES.Identifier &&
            specifier.imported.name === noBareProcessCwdStatics.gateway.cwdExport
          ) {
            cwdLocalNames.add(specifier.local.name);
          }
        }
      },
      CallExpression: (node: TSESTree.CallExpression): void => {
        if (
          !isProcessCwdCallGuard({ node }) &&
          !isGatewayCwdCallGuard({ node, cwdLocalNames, namespaceLocalNames })
        ) {
          return;
        }
        ctx.report({
          node,
          messageId: 'bareProcessCwd',
        });
      },
    };
  },
});

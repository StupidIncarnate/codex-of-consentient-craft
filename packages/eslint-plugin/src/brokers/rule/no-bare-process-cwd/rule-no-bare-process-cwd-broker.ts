/**
 * PURPOSE: Bans `process.cwd()` outside a configurable allowlist of CLI entry points and path-resolver folders
 *
 * USAGE:
 * const rule = ruleNoBareProcessCwdBroker();
 * // Returns ESLint rule that flags process.cwd() except in allowed files/folders/test files
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent cwd-as-target bugs (wrong cwd at spawn time, install scripts run from sub-package, hook payload trusted blindly, etc.)
 */
import type { GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isProcessCwdCallGuard } from '../../../guards/is-process-cwd-call/is-process-cwd-call-guard';
import { isHarnessOrProxyFileGuard } from '../../../guards/is-harness-or-proxy-file/is-harness-or-proxy-file-guard';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { filePathToCwdRelativeTransformer } from '../../../transformers/file-path-to-cwd-relative/file-path-to-cwd-relative-transformer';
import { minimatch } from '#gateway/npm/minimatch';
import { noBareProcessCwdStatics } from '../../../statics/no-bare-process-cwd/no-bare-process-cwd-statics';

export const ruleNoBareProcessCwdBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban process.cwd() outside CLI entry points (start-install.ts) and path-resolver brokers. Walk up from a known anchor and pass an absolute path through your call chain.',
      },
      messages: {
        bareProcessCwd:
          'process.cwd() is only valid as a seed at CLI entry points (default: start-install.ts) or inside a path-resolver broker. Walk up from a known anchor (package.json, your config file) and pass an absolute path through your call chain instead.',
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
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
      cwd?: PathSegment;
      options?: {
        allowedFiles?: readonly GlobPattern[];
        allowedFolders?: readonly GlobPattern[];
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
        minimatch(String(relativePath), String(pattern), { dot: true }) ||
        minimatch(filename, String(pattern), { dot: true }),
    );
    if (isAllowed) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        if (!isProcessCwdCallGuard({ node })) {
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

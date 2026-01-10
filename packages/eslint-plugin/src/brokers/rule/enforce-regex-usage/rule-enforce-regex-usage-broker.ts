/**
 * PURPOSE: Restricts regex usage to specific folders where regex is explicitly allowed
 *
 * USAGE:
 * const rule = ruleEnforceRegexUsageBroker();
 * // Returns ESLint rule that allows regex only in folders with allowRegex: true (guards, transformers, etc.)
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { folderTypeTransformer } from '../../../transformers/folder-type/folder-type-transformer';
import { folderConfigTransformer } from '../../../transformers/folder-config/folder-config-transformer';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

// Get allowed folders from config
const allowedFolders = Object.entries(folderConfigStatics)
  .filter(([_, config]) => config.allowRegex)
  .map(([folderType]) => folderType)
  .join(', ');

export const ruleEnforceRegexUsageBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce regex usage is only allowed in folders with allowRegex: true',
      },
      messages: {
        forbiddenRegex:
          'Regex literals are not allowed in {{folderType}}/ folder. Only allowed in: {{allowedFolders}}. Use mcp__dungeonmaster__discover to search for existing code that does what you need. If none exists, create one in an allowed folder.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;

    return {
      Literal: (node: Tsestree): void => {
        // Check if this is a regex literal by checking if value is a RegExp
        if (!(node.value instanceof RegExp)) {
          return;
        }

        const filename = ctx.filename ?? '';

        // Allow regex in test files
        if (isTestFileGuard({ filename })) {
          return;
        }

        // Get the folder type from the current file
        const folderType = folderTypeTransformer({ filename });

        if (folderType === null) {
          return;
        }

        // Get folder config
        const folderConfig = folderConfigTransformer({ folderType }) as
          | { allowRegex?: boolean }
          | undefined;

        // If config doesn't exist or allowRegex is false, report error
        if (!folderConfig || folderConfig.allowRegex !== true) {
          ctx.report({
            node,
            messageId: 'forbiddenRegex',
            data: {
              folderType,
              allowedFolders,
            },
          });
        }
      },
    };
  },
});

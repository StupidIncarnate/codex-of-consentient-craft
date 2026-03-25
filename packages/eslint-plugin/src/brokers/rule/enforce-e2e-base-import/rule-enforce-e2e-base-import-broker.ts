/**
 * PURPOSE: Enforces that spec files import { test, expect } from '@dungeonmaster/testing/e2e' instead of '@playwright/test'
 *
 * USAGE:
 * const rule = ruleEnforceE2eBaseImportBroker();
 * // Returns ESLint rule that prevents direct @playwright/test imports in .spec.ts files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';

export const ruleEnforceE2eBaseImportBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce that spec files import from @dungeonmaster/testing/e2e instead of @playwright/test — the testing/e2e export includes automatic network recording.',
      },
      messages: {
        useTestingE2e:
          "Import { test, expect } from '@dungeonmaster/testing/e2e' in spec files — this includes automatic network recording. Do not import directly from '@playwright/test'.",
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      ImportDeclaration: (node: Tsestree): void => {
        const isSpecFile = isSpecFileGuard({ filename: ctx.filename ?? '' });

        if (!isSpecFile) {
          return;
        }

        const { source } = node;

        if (source?.value === '@playwright/test') {
          ctx.report({
            node,
            messageId: 'useTestingE2e',
          });
        }
      },
    };
  },
});

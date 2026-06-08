/**
 * PURPOSE: Enforces that Playwright e2e files import { test, expect } from the web-relative test/harnesses/e2e-fixtures module instead of '@playwright/test'
 *
 * USAGE:
 * const rule = ruleEnforceE2eBaseImportBroker();
 * // Returns ESLint rule that prevents direct @playwright/test imports in .e2e.ts files
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
          'Enforce that Playwright e2e files import from the web-relative test/harnesses/e2e-fixtures module instead of @playwright/test — the e2e-fixtures export includes automatic network recording.',
      },
      messages: {
        useTestingE2e:
          "Import { test, expect } from the web-relative test/harnesses/e2e-fixtures module in e2e files — this includes automatic network recording. Do not import directly from '@playwright/test'.",
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

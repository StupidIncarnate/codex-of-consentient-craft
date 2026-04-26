/**
 * PURPOSE: Bans Reflect.get and Reflect.set calls outside of *-guard.ts and *-contract.ts files
 *
 * USAGE:
 * const rule = ruleBanReflectOutsideGuardsBroker();
 * // Returns ESLint rule that prevents Reflect.get / Reflect.set in brokers, transformers, etc.
 * // Reflect.deleteProperty is NOT banned.
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const ruleBanReflectOutsideGuardsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban Reflect.get and Reflect.set outside of *-guard.ts and *-contract.ts files. Validate untyped property access through a Zod contract instead.',
      },
      messages: {
        banReflectOutsideGuards:
          'Reflect.{{method}} is only allowed in *-guard.ts and *-contract.ts files. Validate the value through a Zod contract (e.g., someContract.parse(x).y) instead of using Reflect.{{method}} as an escape hatch.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.getFilename?.() ?? ctx.filename;

    if (
      filename !== undefined &&
      (filename.endsWith('-guard.ts') ||
        filename.endsWith('-guard.tsx') ||
        filename.endsWith('-contract.ts') ||
        filename.endsWith('-contract.tsx'))
    ) {
      return {};
    }

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (!callee) return;
        if (callee.type !== 'MemberExpression') return;
        if (callee.object?.type !== 'Identifier') return;
        if (callee.object.name !== 'Reflect') return;

        const propertyName = callee.property?.name;

        if (propertyName !== 'get' && propertyName !== 'set') return;

        ctx.report({
          node,
          messageId: 'banReflectOutsideGuards',
          data: { method: propertyName },
        });
      },
    };
  },
});

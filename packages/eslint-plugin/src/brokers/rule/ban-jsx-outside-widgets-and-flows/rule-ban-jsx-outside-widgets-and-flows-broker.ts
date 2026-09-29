/**
 * PURPOSE: Creates the ESLint rule that keeps markup in the two folders built to hold it. Once no
 * folder has an npm allowlist, this is what stops a React component from being filed as an adapter,
 * broker or test helper. Reach for this over an import rule: it judges where the JSX IS, so it holds
 * whatever the file imports. Test, proxy and stub files get no exemption.
 *
 * USAGE:
 * const rule = ruleBanJsxOutsideWidgetsAndFlowsBroker();
 * // Reports `<Box />` in /src/brokers/x/x-broker.tsx, passes it in /src/widgets/x/x-widget.tsx
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const ruleBanJsxOutsideWidgetsAndFlowsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Forbid JSX in any file outside a widgets/ or flows/ folder',
      },
      messages: {
        jsxOutsideWidgetsAndFlows:
          'JSX belongs in `widgets/` (or a `flows/` file that routes to one). Move this markup into a widget and call that widget from here.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    if (filename.includes('/widgets/') || filename.includes('/flows/')) {
      return {};
    }

    // Only the outermost node of a tree is reported, so one piece of markup is one violation.
    const depth = { value: 0 };

    return {
      JSXElement: (node: Tsestree): void => {
        if (depth.value === 0) {
          ctx.report({ node, messageId: 'jsxOutsideWidgetsAndFlows' });
        }
        depth.value += 1;
      },
      JSXFragment: (node: Tsestree): void => {
        if (depth.value === 0) {
          ctx.report({ node, messageId: 'jsxOutsideWidgetsAndFlows' });
        }
        depth.value += 1;
      },
      'JSXElement:exit': (): void => {
        depth.value -= 1;
      },
      'JSXFragment:exit': (): void => {
        depth.value -= 1;
      },
    };
  },
});

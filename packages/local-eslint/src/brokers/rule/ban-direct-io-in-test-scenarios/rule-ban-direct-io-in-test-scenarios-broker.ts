/**
 * PURPOSE: Bans direct I/O, network mutations, and recipe seeding in test scenario files.
 *
 * USAGE:
 * const rule = ruleBanDirectIoInTestScenariosBroker();
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint.
 */
import { eslintRuleContract } from '@dungeonmaster/eslint-plugin';
import type { EslintRule, EslintContext, Tsestree } from '@dungeonmaster/eslint-plugin';
import { isBanDirectIoScopeFileGuard } from '../../../guards/is-ban-direct-io-scope-file/is-ban-direct-io-scope-file-guard';
import { banDirectIoInTestScenariosStatics } from '../../../statics/ban-direct-io-in-test-scenarios/ban-direct-io-in-test-scenarios-statics';

export const ruleBanDirectIoInTestScenariosBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Bans direct I/O, network mutations, and direct recipe seeding in test scenario files.',
      },
      messages: {
        directIo:
          'Direct I/O, direct network mutations, and direct recipe seeding are banned in test scenario files. All domain state setup and transitions must go through test harnesses (*Harness).',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (!isBanDirectIoScopeFileGuard({ filename: String(filename) })) {
      return {};
    }

    return {
      ImportDeclaration: (node: Tsestree): void => {
        if (typeof node.source?.value !== 'string') {
          return;
        }

        const sourceValue = node.source.value;
        if (banDirectIoInTestScenariosStatics.bannedFsModules.some((m) => m === sourceValue)) {
          ctx.report({ node, messageId: 'directIo' });
          return;
        }

        if (sourceValue.startsWith('@dungeonmaster/hydration-recipes/')) {
          ctx.report({ node, messageId: 'directIo' });
          return;
        }

        if (Array.isArray(node.specifiers)) {
          for (const specifier of node.specifiers) {
            if (
              specifier.type === 'ImportSpecifier' &&
              specifier.imported &&
              specifier.imported.type === 'Identifier' &&
              banDirectIoInTestScenariosStatics.bannedNamedImports.some(
                (i) => i === String(specifier.imported?.name),
              )
            ) {
              ctx.report({ node, messageId: 'directIo' });
              return;
            }
          }
        }
      },
      CallExpression: (node: Tsestree): void => {
        if (!node.callee) {
          return;
        }

        if (node.callee.type === 'Identifier' && String(node.callee.name) === 'fetch') {
          ctx.report({ node, messageId: 'directIo' });
          return;
        }

        if (node.callee.type === 'MemberExpression') {
          const objNode = node.callee.object;
          const propNode = node.callee.property;

          if (
            objNode &&
            propNode &&
            objNode.type === 'Identifier' &&
            propNode.type === 'Identifier'
          ) {
            const isRequestOrAxios =
              String(objNode.name) === 'request' || String(objNode.name) === 'axios';
            const propName = String(propNode.name);
            const isMutationMethod = ['post', 'patch', 'put', 'delete'].some((m) => m === propName);

            if (isRequestOrAxios && isMutationMethod) {
              ctx.report({ node, messageId: 'directIo' });
            }
          }
        }
      },
    };
  },
});

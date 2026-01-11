/**
 * PURPOSE: Enforces proper Jest mocking patterns in proxy files using jest.mocked() for mocked modules
 *
 * USAGE:
 * const rule = ruleEnforceJestMockedUsageBroker();
 * // Returns ESLint rule that requires jest.mocked() for modules with jest.mock(), prevents jest.spyOn() on imports
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { astGetCallFirstArgumentNameTransformer } from '../../../transformers/ast-get-call-first-argument-name/ast-get-call-first-argument-name-transformer';
import type { Identifier, ModulePath } from '@dungeonmaster/shared/contracts';
import { modulePathContract } from '@dungeonmaster/shared/contracts';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const ruleEnforceJestMockedUsageBroker = (): EslintRule => {
  // Track jest.mock() calls (module path -> node for reporting) and imported module names
  const jestMockedModules = new Map<ModulePath, Tsestree>();
  const importedModuleNames = new Map<Identifier, ModulePath>(); // local name -> module source
  const variablesWithJestMocked = new Set<Identifier>();

  return {
    ...eslintRuleContract.parse({
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce proper Jest mocking patterns in proxy files',
        },
        messages: {
          useJestMocked:
            'When using jest.mock(), access the mocked module with jest.mocked(). Use: const mock = jest.mocked({{moduleName}})',
          spyOnModuleImport:
            'jest.spyOn() should only be used for global objects (Date, crypto, console, Math). Use jest.mock() + jest.mocked() for module imports instead.',
          nonAdapterNoJestMocked:
            'Non-adapter proxies cannot use jest.mocked(). Only adapters (I/O boundaries) and state proxies (for external systems) should be mocked. Brokers, widgets, and responders must run real code.',
          mockWithoutImport:
            "jest.mock('{{modulePath}}') has no corresponding import. Either import something from '{{modulePath}}' to use with jest.mocked(), or remove this jest.mock() call and delegate to child adapter proxies.",
        },
        schema: [],
      },
    }),
    create: (context: EslintContext) => {
      const ctx = context;
      // Reset state for each file
      jestMockedModules.clear();
      importedModuleNames.clear();
      variablesWithJestMocked.clear();

      // Only check proxy files
      if (!hasFileSuffixGuard({ filename: ctx.filename ?? '', suffix: 'proxy' })) {
        return {};
      }

      return {
        // Track imports to know which names are module imports
        ImportDeclaration: (node: Tsestree): void => {
          const imports = astGetImportsTransformer({ node });
          for (const [name, source] of imports) {
            importedModuleNames.set(name, source);
          }
        },

        // Track jest.mock() calls
        CallExpression: (node: Tsestree): void => {
          // Track jest.mock() calls
          if (isAstMethodCallGuard({ node, object: 'jest', method: 'mock' })) {
            if (node.arguments && node.arguments.length > 0) {
              const [firstArg] = node.arguments;
              if (firstArg && firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                const parseResult = modulePathContract.safeParse(firstArg.value);
                if (parseResult.success) {
                  jestMockedModules.set(parseResult.data, node);
                }
              }
            }
          }

          // Check jest.spyOn() usage
          if (isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })) {
            const target = astGetCallFirstArgumentNameTransformer({ node });
            const isAllowedGlobal = jestMockingStatics.allowedSpyOnGlobals.some(
              (global) => global === target,
            );
            if (target && !isAllowedGlobal) {
              // Check if this is an imported module
              if (importedModuleNames.has(target)) {
                ctx.report({
                  node,
                  messageId: 'spyOnModuleImport',
                });
              }
            }
          }
        },

        // Track variables that use jest.mocked() and check for direct assignments
        VariableDeclarator: (node: Tsestree): void => {
          if (!node.init || !node.id) {
            return;
          }

          // Check if using jest.mocked()
          if (isAstMethodCallGuard({ node: node.init, object: 'jest', method: 'mocked' })) {
            // Check if this is a non-adapter/non-state proxy using jest.mocked()
            // State proxies can use jest.mocked() for external systems (Redis, DB)
            const filename = ctx.filename ?? '';
            const isAdapter =
              filename.includes('/adapters/') && hasFileSuffixGuard({ filename, suffix: 'proxy' });
            const isState =
              filename.includes('/state/') && hasFileSuffixGuard({ filename, suffix: 'proxy' });
            if (!isAdapter && !isState) {
              ctx.report({
                node,
                messageId: 'nonAdapterNoJestMocked',
              });
              return;
            }

            // Extract the module name from jest.mocked(moduleName)
            if (node.init.arguments && node.init.arguments.length > 0) {
              const [arg] = node.init.arguments;
              if (arg && arg.type === 'Identifier' && arg.name) {
                variablesWithJestMocked.add(arg.name);
              }
            }
            return;
          }

          // Check if assigning directly to an imported module (without jest.mocked)
          // This includes both plain identifiers and TSAsExpressions
          let importedName: Identifier | null = null;

          if (node.init.type === 'Identifier' && node.init.name) {
            importedName = node.init.name;
          } else if (node.init.type === 'TSAsExpression' && node.init.expression) {
            // Handle: const mock = axios as jest.MockedFunction<typeof axios>
            if (node.init.expression.type === 'Identifier' && node.init.expression.name) {
              importedName = node.init.expression.name;
            }
          }

          if (importedName && importedModuleNames.has(importedName)) {
            const source = importedModuleNames.get(importedName);
            // Check if this module was mocked with jest.mock()
            if (source && jestMockedModules.has(source)) {
              ctx.report({
                node,
                messageId: 'useJestMocked',
                data: {
                  moduleName: importedName,
                },
              });
            }
          }
        },

        // At the end of the file, check if all jest.mock() calls have corresponding imports
        'Program:exit': (): void => {
          // Get all imported module paths as a Set for O(1) lookup
          const importedModulePaths = new Set(importedModuleNames.values());

          // Check each jest.mock() has a corresponding import
          for (const [modulePath, mockNode] of jestMockedModules) {
            if (!importedModulePaths.has(modulePath)) {
              ctx.report({
                node: mockNode,
                messageId: 'mockWithoutImport',
                data: { modulePath },
              });
            }
          }
        },
      };
    },
  };
};

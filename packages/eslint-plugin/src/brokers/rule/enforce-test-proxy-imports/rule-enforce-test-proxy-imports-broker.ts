import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { testFilePathToColocatedProxyPathTransformer } from '../../../transformers/test-file-path-to-colocated-proxy-path/test-file-path-to-colocated-proxy-path-transformer';
import { filePathContract } from '@questmaestro/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isProxyImportGuard } from '../../../guards/is-proxy-import/is-proxy-import-guard';
import { normalizeImportPathTransformer } from '../../../transformers/normalize-import-path/normalize-import-path-transformer';

export const ruleEnforceTestProxyImportsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ensure test files only import their colocated proxy file, not other proxies. Integration tests cannot import proxies at all.',
      },
      messages: {
        nonColocatedProxyImport:
          'Test files can only import their colocated proxy file. Import {{colocatedProxyPath}} instead of {{importPath}}.',
        multipleProxyImports:
          'Test files should only import one proxy file (their colocated proxy). Found imports: {{proxyImports}}.',
        integrationTestNoProxy:
          'Integration tests cannot import proxy files. Remove {{importPath}} import.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    // Only check test files
    if (!isTestFileGuard({ filename })) {
      return {};
    }

    // Check if this is an integration test
    const isIntegrationTest = hasFileSuffixGuard({ filename, suffix: 'integration.test' });

    // Derive the expected colocated proxy path
    // e.g., /src/brokers/user/user-broker.test.ts → ./user-broker.proxy
    const filePathValue = filePathContract.parse(filename);
    const expectedColocatedProxy = testFilePathToColocatedProxyPathTransformer({
      testFilePath: filePathValue,
    });
    let proxyImportCount = 0;

    return {
      ImportDeclaration: (node: Tsestree): void => {
        const importSource = node.source?.value;

        if (typeof importSource !== 'string') {
          return;
        }

        // Check if import is a proxy file (with or without .ts/.tsx extension)
        if (!isProxyImportGuard({ importSource })) {
          return;
        }

        // Integration tests cannot import any proxy files
        // EXCEPTION: Startup integration tests CAN import their colocated proxy
        if (isIntegrationTest) {
          const isStartupFolder = filename.includes('/startup/');

          // Startup integration tests can import their colocated proxy file
          if (isStartupFolder) {
            // Check if it's the colocated proxy (same as unit tests)
            const normalizedImport = normalizeImportPathTransformer({ importPath: importSource });
            const normalizedExpected = normalizeImportPathTransformer({
              importPath: expectedColocatedProxy,
            });

            // If it's not the colocated proxy, report error
            if (normalizedImport !== normalizedExpected) {
              ctx.report({
                node,
                messageId: 'nonColocatedProxyImport',
                data: {
                  importPath: importSource,
                  colocatedProxyPath: expectedColocatedProxy,
                },
              });
            }
            // If it is colocated, allow it
            return;
          }

          // All other integration tests cannot import proxies
          ctx.report({
            node,
            messageId: 'integrationTestNoProxy',
            data: {
              importPath: importSource,
            },
          });
          return;
        }

        // Increment proxy import count
        proxyImportCount += 1;

        // Normalize import paths for comparison (remove .ts/.tsx extensions)
        const normalizedImport = normalizeImportPathTransformer({ importPath: importSource });
        const normalizedExpected = normalizeImportPathTransformer({
          importPath: expectedColocatedProxy,
        });

        // Check if this is the colocated proxy
        if (normalizedImport !== normalizedExpected) {
          ctx.report({
            node,
            messageId: 'nonColocatedProxyImport',
            data: {
              importPath: importSource,
              colocatedProxyPath: expectedColocatedProxy,
            },
          });
        }

        // Report if multiple proxies are being imported (on the 2nd+ import)
        if (proxyImportCount > 1) {
          ctx.report({
            node,
            messageId: 'multipleProxyImports',
            data: {
              proxyImports: `${proxyImportCount} proxy imports found`,
            },
          });
        }
      },
    };
  },
});

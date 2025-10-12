import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

interface NodeWithSource {
  source?: { value?: unknown };
}

export const enforceTestProxyImportsRuleBroker = (): Rule.RuleModule => ({
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
  create: (context: Rule.RuleContext) => {
    const { filename } = context;

    // Only check test files
    if (!isTestFileGuard({ filename })) {
      return {};
    }

    // Check if this is an integration test
    const isIntegrationTest = filename.includes('.integration.test.');

    // Derive the expected colocated proxy path
    // e.g., /src/brokers/user/user-broker.test.ts → ./user-broker.proxy
    const getColocatedProxyPath = (testFilePath: string): string => {
      // Remove .test.ts, .test.tsx, .spec.ts, .integration.test.ts extensions
      const withoutTestExtension = testFilePath
        .replace(/\.integration\.test\.(ts|tsx)$/u, '')
        .replace(/\.test\.(ts|tsx)$/u, '')
        .replace(/\.spec\.(ts|tsx)$/u, '');

      // Get just the base filename
      const baseFileName = withoutTestExtension.split('/').pop() ?? '';

      // Return relative path to colocated proxy
      return `./${baseFileName}.proxy`;
    };

    const expectedColocatedProxy = getColocatedProxyPath(filename);
    let proxyImportCount = 0;

    return {
      ImportDeclaration: (node): void => {
        const nodeWithSource = node as unknown as NodeWithSource;
        const importSource = nodeWithSource.source?.value;

        if (typeof importSource !== 'string') {
          return;
        }

        // Check if this is a proxy import (ends with .proxy or .proxy.ts/.proxy.tsx)
        const isProxyImport =
          importSource.endsWith('.proxy') ||
          importSource.endsWith('.proxy.ts') ||
          importSource.endsWith('.proxy.tsx');

        if (!isProxyImport) {
          return;
        }

        // Integration tests cannot import any proxy files
        if (isIntegrationTest) {
          context.report({
            node,
            messageId: 'integrationTestNoProxy',
            data: {
              importPath: importSource,
            },
          });
          return;
        }

        // Increment proxy import count
        proxyImportCount++;

        // Normalize import path for comparison (remove .ts/.tsx extensions)
        const normalizedImport = importSource
          .replace(/\.proxy\.(ts|tsx)$/u, '.proxy')
          .replace(/\.ts$/u, '')
          .replace(/\.tsx$/u, '');

        const normalizedExpected = expectedColocatedProxy
          .replace(/\.proxy\.(ts|tsx)$/u, '.proxy')
          .replace(/\.ts$/u, '')
          .replace(/\.tsx$/u, '');

        // Check if this is the colocated proxy
        if (normalizedImport !== normalizedExpected) {
          context.report({
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
          context.report({
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

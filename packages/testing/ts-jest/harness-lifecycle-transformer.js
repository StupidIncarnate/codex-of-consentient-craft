/**
 * ts-jest AST transformer for wiring harness lifecycle hooks (beforeEach/afterEach)
 *
 * Detects *Harness() calls in integration test files and wraps them with
 * __wireHarnessLifecycle() which is defined in jest.setup.js. This auto-registers
 * the harness's beforeEach/afterEach hooks with Jest.
 *
 * Usage in jest.config.js:
 *   astTransformers: {
 *     before: ['@dungeonmaster/testing/ts-jest/harness-lifecycle-transformer.js']
 *   }
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Compute version from all harness files so cache invalidates when harnesses change
const computeVersion = () => {
  try {
    const { globSync } = require('glob');
    const packagesRoot = path.resolve(__dirname, '../../');
    const hash = crypto.createHash('md5');

    const harnessFiles = globSync('*/test/**/*.harness.ts', { cwd: packagesRoot }).sort();
    for (const harnessFile of harnessFiles) {
      const fullPath = path.join(packagesRoot, harnessFile);
      hash.update(fs.readFileSync(fullPath, 'utf-8'));
    }

    return harnessFiles.length > 0 ? hash.digest('hex').slice(0, 8) : '1.0.0';
  } catch {
    return '1.0.0';
  }
};

exports.name = 'harness-lifecycle-transformer';
exports.version = computeVersion();

exports.factory = () => (context) => (sourceFile) => {
  // Only process integration test files
  if (!sourceFile.fileName.includes('.integration.test.ts')) {
    return sourceFile;
  }

  const { factory } = context;
  let hasTransformed = false;

  function isHarnessCall(node) {
    return (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text.endsWith('Harness')
    );
  }

  function wrapWithWire(callExpression) {
    return factory.createCallExpression(
      factory.createIdentifier('__wireHarnessLifecycle'),
      undefined,
      [callExpression],
    );
  }

  function visit(node) {
    // VariableDeclaration: const guilds = guildHarness() → const guilds = __wireHarnessLifecycle(guildHarness())
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer !== undefined &&
      isHarnessCall(node.initializer)
    ) {
      hasTransformed = true;
      return factory.updateVariableDeclaration(
        node,
        node.name,
        node.exclamationToken,
        node.type,
        wrapWithWire(node.initializer),
      );
    }

    // ExpressionStatement: bare guildHarness() → __wireHarnessLifecycle(guildHarness())
    if (ts.isExpressionStatement(node) && isHarnessCall(node.expression)) {
      hasTransformed = true;
      return factory.updateExpressionStatement(node, wrapWithWire(node.expression));
    }

    return ts.visitEachChild(node, visit, context);
  }

  const transformed = ts.visitEachChild(sourceFile, visit, context);

  return hasTransformed ? transformed : sourceFile;
};

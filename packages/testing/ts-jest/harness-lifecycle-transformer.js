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

// ts-jest requires this file by path on its own, so the tsx CJS hook has to be registered here too
// — see the comment in transformers.js.
require('tsx/cjs');

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { consumerPackagesRoot } = require('./consumer-packages-root');

// Compute version from all harness files so cache invalidates when harnesses change. Hashes
// dungeonmaster's own packages, and the repo under test when that is a different repo: through a
// `file:` link or an install this file never sits inside the repo whose harnesses it transforms.
const computeVersion = () => {
  try {
    const { globSync } = require('glob');
    const ownPackagesRoot = path.resolve(__dirname, '../../');
    const consumerRoot = consumerPackagesRoot({ startDir: process.cwd() });
    const packagesRoots =
      consumerRoot === null || consumerRoot === ownPackagesRoot
        ? [ownPackagesRoot]
        : [ownPackagesRoot, consumerRoot];
    const hash = crypto.createHash('md5');

    const harnessFiles = packagesRoots.flatMap((packagesRoot) =>
      globSync('*/test/**/*.harness.ts', { cwd: packagesRoot })
        .sort()
        .map((harnessFile) => path.join(packagesRoot, harnessFile)),
    );
    for (const fullPath of harnessFiles) {
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

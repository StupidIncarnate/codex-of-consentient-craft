/**
 * ts-jest AST transformer for hoisting jest.mock() calls from .proxy.ts files
 *
 * Usage in jest.config.js:
 *   astTransformers: {
 *     before: ['@dungeonmaster/testing/ts-jest/proxy-mock-transformer.js']
 *   }
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  typescriptProxyMockTransformerMiddleware,
} = require('../dist/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware');
const {
  typescriptProgramContract,
} = require('../dist/contracts/typescript-program/typescript-program-contract');

// Compute version from shared/testing.ts barrel AND all proxy files across the monorepo,
// so cache invalidates when any proxy file's jest.mock() calls change.
// Proxy files outside the test file itself affect the hoisted mocks, so ALL proxy files
// must contribute to the cache key.
const computeVersion = () => {
  try {
    const { globSync } = require('glob');
    const barrelPath = path.resolve(__dirname, '../../shared/testing.ts');
    const packagesRoot = path.resolve(__dirname, '../../');
    const hash = crypto.createHash('md5');

    hash.update(fs.readFileSync(barrelPath, 'utf-8'));

    const proxyFiles = globSync('*/src/**/*.proxy.ts', { cwd: packagesRoot }).sort();
    for (const proxyFile of proxyFiles) {
      const fullPath = path.join(packagesRoot, proxyFile);
      hash.update(fs.readFileSync(fullPath, 'utf-8'));
    }

    return hash.digest('hex').slice(0, 8);
  } catch {
    return '2.0.0';
  }
};

// Required by ts-jest for transformer identification and caching
exports.name = 'proxy-mock-transformer';
exports.version = computeVersion();

// ts-jest requires the transformer factory to be exported as 'factory'
exports.factory =
  ({ program }) =>
  ({ factory: nodeFactory }) =>
  (sourceFile) => {
    // Only process .test.ts files
    if (!sourceFile.fileName.includes('.test.ts')) {
      return sourceFile;
    }

    const transformedSourceFile = typescriptProxyMockTransformerMiddleware({
      sourceFile,
      program: typescriptProgramContract.parse(program),
      nodeFactory,
    });

    return transformedSourceFile;
  };

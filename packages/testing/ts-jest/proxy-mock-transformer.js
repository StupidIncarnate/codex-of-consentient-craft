/**
 * ts-jest AST transformer for hoisting jest.mock() calls from .proxy.ts files
 *
 * Usage in jest.config.js:
 *   astTransformers: {
 *     before: ['@dungeonmaster/testing/ts-jest/proxy-mock-transformer.js']
 *   }
 */
'use strict';

// ts-jest requires this file by path on its own, so the tsx CJS hook has to be registered here too
// — see the comment in transformers.js. It is what makes the two source requires below resolve.
require('tsx/cjs');

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  typescriptProxyMockTransformerMiddleware,
} = require('../src/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware');

// Compute version from shared's package.json (its `./*.proxy` and `./*.stub` export keys decide which files
// a per-file test import reaches) AND all proxy files across the monorepo,
// so cache invalidates when any proxy file's jest.mock() calls change.
// Proxy files outside the test file itself affect the hoisted mocks, so ALL proxy files
// must contribute to the cache key.
const computeVersion = () => {
  try {
    const { globSync } = require('glob');
    const sharedManifestPath = path.resolve(__dirname, '../../shared/package.json');
    const packagesRoot = path.resolve(__dirname, '../../');
    const hash = crypto.createHash('md5');

    hash.update(fs.readFileSync(sharedManifestPath, 'utf-8'));
    hash.update(
      fs.readFileSync(
        path.resolve(
          __dirname,
          '../src/transformers/mock-calls-to-statements/mock-calls-to-statements-transformer.ts',
        ),
        'utf-8',
      ),
    );

    // Also hashed: the gateway's proxies (two folders deep, under `@gateway/`), this package's own
    // import-resolution source, and every package.json — the `imports`/`exports` maps decide which
    // file a `#gateway/.../_test_/...` specifier reaches, so a change there changes what hoists.
    const keyFiles = globSync(
      [
        '*/src/**/*.proxy.ts',
        '@gateway/*/src/**/*.proxy.ts',
        'testing/src/{guards,middleware,transformers,adapters}/**/*.ts',
        '*/package.json',
        '@gateway/*/package.json',
      ],
      { cwd: packagesRoot, ignore: ['**/*.test.ts', '**/node_modules/**'] },
    ).sort();
    for (const keyFile of keyFiles) {
      const fullPath = path.join(packagesRoot, keyFile);
      hash.update(keyFile);
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
      program,
      nodeFactory,
    });

    return transformedSourceFile;
  };

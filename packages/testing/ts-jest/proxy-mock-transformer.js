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

// Compute version from shared/testing.ts barrel content so cache invalidates when proxy exports change
const computeVersion = () => {
  try {
    const barrelPath = path.resolve(__dirname, '../../shared/testing.ts');
    const content = fs.readFileSync(barrelPath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
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

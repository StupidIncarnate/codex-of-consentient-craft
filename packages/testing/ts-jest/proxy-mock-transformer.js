/**
 * ts-jest AST transformer for hoisting jest.mock() calls from .proxy.ts files
 *
 * Usage in jest.config.js:
 *   astTransformers: {
 *     before: ['@questmaestro/testing/ts-jest/proxy-mock-transformer.js']
 *   }
 */
'use strict';

const {
  typescriptProxyMockTransformerMiddleware,
} = require('../dist/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware');
const {
  typescriptProgramContract,
} = require('../dist/contracts/typescript-program/typescript-program-contract');

// Required by ts-jest for transformer identification and caching
exports.name = 'proxy-mock-transformer';
exports.version = '1.0.0';

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

/**
 * PURPOSE: TypeScript AST transformer for Jest that hoists jest.mock() calls from .proxy.ts files
 *
 * USAGE:
 * // In jest.config.js
 * module.exports = {
 *   globals: {
 *     'ts-jest': {
 *       astTransformers: {
 *         before: ['@questmaestro/testing/dist/adapters/typescript/proxy-mock-transformer/typescript-proxy-mock-transformer-adapter.js']
 *       }
 *     }
 *   }
 * };
 * // Automatically hoists jest.mock() calls from proxy files to the top of test files during compilation
 *
 * WHEN-TO-USE: When using proxy pattern with jest.mock() calls that need to be hoisted for Jest to recognize them
 */

import type * as ts from 'typescript';
import { typescriptProxyMockTransformerMiddleware } from '../../../middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware';
import { typescriptProgramContract } from '../../../contracts/typescript-program/typescript-program-contract';
import type { TypescriptSourceFile } from '../../../contracts/typescript-source-file/typescript-source-file-contract';
import type { TypescriptNodeFactory } from '../../../contracts/typescript-node-factory/typescript-node-factory-contract';

export const typescriptProxyMockTransformerAdapter =
  ({ program }: { program: ts.Program }): ts.TransformerFactory<ts.SourceFile> =>
  ({ factory: nodeFactory }: ts.TransformationContext) =>
  (sourceFile: ts.SourceFile): ts.SourceFile => {
    // Only process .test.ts files
    if (!sourceFile.fileName.includes('.test.ts')) {
      return sourceFile;
    }

    const transformedSourceFile = typescriptProxyMockTransformerMiddleware({
      sourceFile: sourceFile as unknown as TypescriptSourceFile,
      program: typescriptProgramContract.parse(program),
      nodeFactory: nodeFactory as unknown as TypescriptNodeFactory,
    });

    return transformedSourceFile as unknown as ts.SourceFile;
  };

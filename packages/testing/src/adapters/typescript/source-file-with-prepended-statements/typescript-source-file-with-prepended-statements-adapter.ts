/**
 * PURPOSE: Prepends statements to the beginning of a TypeScript source file
 *
 * USAGE:
 * const newSourceFile = typescriptSourceFileWithPrependedStatementsAdapter({
 *   sourceFile,
 *   statements,
 *   nodeFactory
 * });
 * // Returns new source file with statements prepended
 */

import type * as ts from 'typescript';
import type { TypescriptSourceFile } from '../../../contracts/typescript-source-file/typescript-source-file-contract';
import type { TypescriptStatement } from '../../../contracts/typescript-statement/typescript-statement-contract';
import type { TypescriptNodeFactory } from '../../../contracts/typescript-node-factory/typescript-node-factory-contract';

export const typescriptSourceFileWithPrependedStatementsAdapter = ({
  sourceFile,
  statements,
  nodeFactory,
}: {
  sourceFile: TypescriptSourceFile;
  statements: TypescriptStatement[];
  nodeFactory: TypescriptNodeFactory;
}): TypescriptSourceFile => {
  const tsSourceFile = sourceFile as unknown as ts.SourceFile;
  const tsStatements = statements as unknown as ts.Statement[];
  const tsNodeFactory = nodeFactory as unknown as ts.NodeFactory;

  const allStatements = tsNodeFactory.createNodeArray([
    ...tsStatements,
    ...tsSourceFile.statements,
  ]);

  return tsNodeFactory.updateSourceFile(
    tsSourceFile,
    allStatements,
  ) as unknown as TypescriptSourceFile;
};

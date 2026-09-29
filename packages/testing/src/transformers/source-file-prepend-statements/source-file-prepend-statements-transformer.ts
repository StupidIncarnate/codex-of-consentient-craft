/**
 * PURPOSE: Prepends statements to the beginning of a TypeScript source file
 *
 * USAGE:
 * const newSourceFile = sourceFilePrependStatementsTransformer({
 *   sourceFile,
 *   statements,
 *   nodeFactory
 * });
 * // Returns new source file with statements prepended
 */

import type * as ts from '#gateway/npm/typescript';

export const sourceFilePrependStatementsTransformer = ({
  sourceFile,
  statements,
  nodeFactory,
}: {
  sourceFile: ts.SourceFile;
  statements: ts.Statement[];
  nodeFactory: ts.NodeFactory;
}): ts.SourceFile => {
  const allStatements = nodeFactory.createNodeArray([...statements, ...sourceFile.statements]);

  return nodeFactory.updateSourceFile(sourceFile, allStatements);
};

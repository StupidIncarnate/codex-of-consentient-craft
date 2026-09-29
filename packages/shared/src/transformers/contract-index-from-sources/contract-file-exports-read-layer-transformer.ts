/**
 * PURPOSE: Reads what a `-contract.ts` file exports: its consts, and for every exported type whether
 * it is inferred from a schema declared in the same file or exempt because Zod has no schema for it.
 * An alias or interface with type parameters is exempt as a compile-time type; a function type, a
 * method set and data plus functions are exempt through the shape classifier.
 *
 * USAGE:
 * contractFileExportsReadLayerTransformer({ sourceFile });
 * // Returns { exportedConstNames, typeExports: [{ typeName, isSchemaInferred, isExempt }] }
 */
import * as ts from '#gateway/npm/typescript';

import { identifierContract } from '../../contracts/identifier/identifier-contract';
import type { Identifier } from '../../contracts/identifier/identifier-contract';
import { typeNodeShapeClassifyLayerTransformer } from './type-node-shape-classify-layer-transformer';

export const contractFileExportsReadLayerTransformer = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): {
  exportedConstNames: Identifier[];
  typeExports: { typeName: Identifier; isSchemaInferred: boolean; isExempt: boolean }[];
} => {
  const exportedStatements = sourceFile.statements.filter(
    (statement) =>
      ts.canHaveModifiers(statement) &&
      (ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ),
  );

  const schemaNames = sourceFile.statements
    .filter((statement): statement is ts.VariableStatement => ts.isVariableStatement(statement))
    .flatMap((statement) => statement.declarationList.declarations)
    .flatMap((declaration) =>
      ts.isIdentifier(declaration.name) ? [identifierContract.parse(declaration.name.text)] : [],
    );

  const exportedConstNames = exportedStatements
    .filter((statement): statement is ts.VariableStatement => ts.isVariableStatement(statement))
    .flatMap((statement) => statement.declarationList.declarations)
    .flatMap((declaration) =>
      ts.isIdentifier(declaration.name) ? [identifierContract.parse(declaration.name.text)] : [],
    );

  const typeExports = exportedStatements
    .filter(
      (statement): statement is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
        ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement),
    )
    .map((declaration) => {
      const shape = typeNodeShapeClassifyLayerTransformer({
        node: ts.isTypeAliasDeclaration(declaration) ? declaration.type : declaration,
        schemaNames,
      });
      return {
        typeName: identifierContract.parse(declaration.name.text),
        isSchemaInferred: shape === 'inferred',
        isExempt:
          shape === 'functions' ||
          shape === 'data-plus-functions' ||
          declaration.typeParameters !== undefined,
      };
    });

  return { exportedConstNames, typeExports };
};

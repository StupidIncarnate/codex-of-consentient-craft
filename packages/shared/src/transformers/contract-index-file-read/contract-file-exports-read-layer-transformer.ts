/**
 * PURPOSE: Reads what a `-contract.ts` file exports: its consts, and for every exported type whether
 * it is inferred from a schema declared in the same file or exempt because Zod has no schema for it.
 * An alias or interface with type parameters is exempt as a compile-time type; a function type, a
 * method set, data plus functions and a unique-symbol phantom carrier are exempt through the shape
 * classifier, which reads same-file aliases through `typeAliases`.
 *
 * USAGE:
 * contractFileExportsReadLayerTransformer({ sourceFile });
 * // Returns { exportedConstNames, typeExports: [{ typeName, isSchemaInferred, isExempt }] }
 */
import { contractFileExportsReadLayerContract } from '../../contracts/contract-file-exports-read-layer/contract-file-exports-read-layer-contract';
import type { ContractFileExportsReadLayer } from '../../contracts/contract-file-exports-read-layer/contract-file-exports-read-layer-contract';
import * as ts from '#gateway/npm/typescript';

import { typeNodeShapeClassifyLayerTransformer } from './type-node-shape-classify-layer-transformer';

export const contractFileExportsReadLayerTransformer = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): ContractFileExportsReadLayer => {
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
    .flatMap((declaration) => (ts.isIdentifier(declaration.name) ? [declaration.name.text] : []));

  const uniqueSymbolNames = sourceFile.statements
    .filter((statement): statement is ts.VariableStatement => ts.isVariableStatement(statement))
    .flatMap((statement) => statement.declarationList.declarations)
    .flatMap((declaration) =>
      ts.isIdentifier(declaration.name) &&
      declaration.type?.kind === ts.SyntaxKind.TypeOperator &&
      declaration.type.getText() === 'unique symbol'
        ? [declaration.name.text]
        : [],
    );

  const typeAliases = sourceFile.statements
    .filter(
      (statement): statement is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
        (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
        statement.typeParameters === undefined,
    )
    .map((statement) => ({
      name: statement.name.text,
      node: ts.isTypeAliasDeclaration(statement) ? statement.type : statement,
    }));

  const exportedConstNames = exportedStatements
    .filter((statement): statement is ts.VariableStatement => ts.isVariableStatement(statement))
    .flatMap((statement) => statement.declarationList.declarations)
    .flatMap((declaration) => (ts.isIdentifier(declaration.name) ? [declaration.name.text] : []));

  const typeExports = exportedStatements
    .filter(
      (statement): statement is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
        ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement),
    )
    .map((declaration) => {
      const shape = typeNodeShapeClassifyLayerTransformer({
        node: ts.isTypeAliasDeclaration(declaration) ? declaration.type : declaration,
        schemaNames,
        typeAliases,
        uniqueSymbolNames,
        visitedNames: [declaration.name.text],
      });
      return {
        typeName: declaration.name.text,
        isSchemaInferred: shape === 'inferred',
        isExempt:
          shape === 'functions' ||
          shape === 'data-plus-functions' ||
          shape === 'phantom' ||
          declaration.typeParameters !== undefined,
      };
    });

  return contractFileExportsReadLayerContract.parse({ exportedConstNames, typeExports });
};

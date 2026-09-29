/**
 * PURPOSE: Reads one `-contract.ts` file for the owner index: each exported object contract with its
 * owner name, inferred type, schema text and top-level keys, and each exported standalone branded
 * contract with its brand text, and each exported `z.enum([...])` contract with its sorted values.
 * A key is classified by how it gets its value: own brand, reuse of `owner.shape.key`, a reference
 * to another contract, or plain. A getter key is read through its returned expression.
 *
 * USAGE:
 * contractFileOwnersReadLayerTransformer({ sourceFile, filePath, packageName });
 * // Returns { owners, standaloneBrands, enums }: OwnerIndexOwner[], OwnerIndexStandaloneBrand[], OwnerIndexEnum[]
 */
import * as ts from '#gateway/npm/typescript';

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import { identifierContract } from '../../contracts/identifier/identifier-contract';
import { ownerIndexEnumContract } from '../../contracts/owner-index-enum/owner-index-enum-contract';
import type { OwnerIndexEnum } from '../../contracts/owner-index-enum/owner-index-enum-contract';
import type { OwnerIndexField } from '../../contracts/owner-index-field/owner-index-field-contract';
import { ownerIndexFieldContract } from '../../contracts/owner-index-field/owner-index-field-contract';
import { ownerIndexOwnerContract } from '../../contracts/owner-index-owner/owner-index-owner-contract';
import type { OwnerIndexOwner } from '../../contracts/owner-index-owner/owner-index-owner-contract';
import { ownerIndexStandaloneBrandContract } from '../../contracts/owner-index-standalone-brand/owner-index-standalone-brand-contract';
import type { OwnerIndexStandaloneBrand } from '../../contracts/owner-index-standalone-brand/owner-index-standalone-brand-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import { contractIndexStatics } from '../../statics/contract-index/contract-index-statics';
import { enumValuesReadTransformer } from '../enum-values-read/enum-values-read-transformer';
import { contractChainReadLayerTransformer } from './contract-chain-read-layer-transformer';

const CONTRACT_SUFFIX = 'Contract';

export const contractFileOwnersReadLayerTransformer = ({
  sourceFile,
  filePath,
  packageName,
}: {
  sourceFile: ts.SourceFile;
  filePath: AbsoluteFilePath;
  packageName: PackageName;
}): {
  owners: OwnerIndexOwner[];
  standaloneBrands: OwnerIndexStandaloneBrand[];
  enums: OwnerIndexEnum[];
} => {
  const inferredTypeNames = new Map(
    sourceFile.statements
      .filter((statement): statement is ts.TypeAliasDeclaration =>
        ts.isTypeAliasDeclaration(statement),
      )
      .filter(
        (statement) =>
          (ts.getModifiers(statement) ?? []).some(
            (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
          ) && ts.isTypeReferenceNode(statement.type),
      )
      .flatMap((statement) => {
        const reference = statement.type;
        if (!ts.isTypeReferenceNode(reference)) {
          return [];
        }
        const referenceName = reference.typeName.getText(sourceFile).split('.').at(-1) ?? '';
        const [argument] = reference.typeArguments ?? [];
        return contractIndexStatics.types.inferNames.some((name) => name === referenceName) &&
          argument !== undefined &&
          ts.isTypeQueryNode(argument)
          ? [[argument.exprName.getText(sourceFile), statement.name.text] as const]
          : [];
      }),
  );

  const declarations = sourceFile.statements
    .filter((statement): statement is ts.VariableStatement => ts.isVariableStatement(statement))
    .filter((statement) =>
      (ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ),
    )
    .flatMap((statement) => statement.declarationList.declarations)
    .flatMap((declaration) =>
      ts.isIdentifier(declaration.name) &&
      declaration.name.text.endsWith(CONTRACT_SUFFIX) &&
      declaration.name.text.length > CONTRACT_SUFFIX.length &&
      declaration.initializer !== undefined
        ? [{ name: declaration.name.text, initializer: declaration.initializer }]
        : [],
    )
    .map(({ name, initializer }) => ({
      name,
      initializer,
      chain: contractChainReadLayerTransformer({ node: initializer }),
    }));

  const owners = declarations.flatMap(({ name, initializer, chain }) => {
    const { objectLiteral } = chain;
    if (objectLiteral === undefined || !ts.isObjectLiteralExpression(objectLiteral)) {
      return [];
    }
    const fields = objectLiteral.properties.flatMap((property): OwnerIndexField[] => {
      const keyNode = property.name;
      if (
        keyNode === undefined ||
        !(ts.isIdentifier(keyNode) || ts.isStringLiteral(keyNode)) ||
        !(ts.isPropertyAssignment(property) || property.kind === ts.SyntaxKind.GetAccessor)
      ) {
        return [];
      }
      const getterBody = ts.forEachChild(property, (child) =>
        ts.isBlock(child) ? child : undefined,
      );
      const valueNode = ts.isPropertyAssignment(property)
        ? property.initializer
        : getterBody?.statements.find(ts.isReturnStatement)?.expression;
      if (valueNode === undefined) {
        return [];
      }
      const read = contractChainReadLayerTransformer({ node: valueNode });
      const key = identifierContract.parse(keyNode.text);
      if (read.shapeContractName !== undefined && read.shapeKey !== undefined) {
        return [
          ownerIndexFieldContract.parse({
            key,
            kind: 'owner-reuse',
            refContractName: read.shapeContractName,
            refKey: read.shapeKey,
          }),
        ];
      }
      if (read.brandText !== undefined) {
        return [
          ownerIndexFieldContract.parse({ key, kind: 'own-brand', brandText: read.brandText }),
        ];
      }
      if (read.rootName?.endsWith(CONTRACT_SUFFIX) === true) {
        return [
          ownerIndexFieldContract.parse({
            key,
            kind: 'contract-ref',
            refContractName: read.rootName,
          }),
        ];
      }
      return [ownerIndexFieldContract.parse({ key, kind: 'plain' })];
    });

    const typeName = inferredTypeNames.get(name);
    return [
      ownerIndexOwnerContract.parse({
        ownerName: name.slice(0, 1).toUpperCase() + name.slice(0, -CONTRACT_SUFFIX.length).slice(1),
        contractName: name,
        filePath,
        packageName,
        ...(typeName === undefined ? {} : { typeName }),
        schemaText: contentTextContract.parse(initializer.getText(sourceFile)),
        fields,
      }),
    ];
  });

  const standaloneBrands = declarations.flatMap(({ name, chain }) =>
    chain.objectLiteral === undefined && chain.brandText !== undefined
      ? [
          ownerIndexStandaloneBrandContract.parse({
            contractName: name,
            brandText: chain.brandText,
            filePath,
            packageName,
          }),
        ]
      : [],
  );

  const enums = declarations.flatMap(({ name, initializer }) => {
    const values = enumValuesReadTransformer({
      text: contentTextContract.parse(initializer.getText(sourceFile)),
    });
    return values === undefined
      ? []
      : [
          ownerIndexEnumContract.parse({
            ownerName:
              name.slice(0, 1).toUpperCase() + name.slice(0, -CONTRACT_SUFFIX.length).slice(1),
            contractName: name,
            filePath,
            packageName,
            values,
          }),
        ];
  });

  return { owners, standaloneBrands, enums };
};

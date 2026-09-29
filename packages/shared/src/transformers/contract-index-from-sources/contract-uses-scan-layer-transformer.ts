/**
 * PURPOSE: Finds, in one production file, every call that parses a contract and every contract the
 * file uses as a value. A parse is `.parse`, `.safeParse`, `.parseAsync` or `.safeParseAsync` called
 * on an expression built from the contract (`xContract.shape.id.parse`, `z.array(xContract).parse`);
 * a value use is any mention outside a type position.
 *
 * USAGE:
 * contractUsesScanLayerTransformer({ sourceFile, bindings });
 * // Returns { parseSites: [{ targetFile, line }], valueTargets: AbsoluteFilePath[] }
 */
import * as ts from '#gateway/npm/typescript';

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import { contractParseSiteContract } from '../../contracts/contract-parse-site/contract-parse-site-contract';
import type { ContractParseSite } from '../../contracts/contract-parse-site/contract-parse-site-contract';
import type { ContractUsesBinding } from '../../contracts/contract-uses-binding/contract-uses-binding-contract';
import { contractIndexStatics } from '../../statics/contract-index/contract-index-statics';

const PARSE_METHOD_NAMES = contractIndexStatics.parse.methodNames;

export const contractUsesScanLayerTransformer = ({
  sourceFile,
  bindings,
}: {
  sourceFile: ts.SourceFile;
  bindings: ContractUsesBinding[];
}): {
  parseSites: { targetFile: AbsoluteFilePath; site: ContractParseSite }[];
  valueTargets: AbsoluteFilePath[];
} => {
  const targetByLocalName = new Map(
    bindings
      .filter((binding) => !binding.isTypeOnly)
      .map((binding) => [String(binding.localName), binding.targetFile] as const),
  );
  const parseSites: { targetFile: AbsoluteFilePath; site: ContractParseSite }[] = [];
  const valueTargets = new Set<AbsoluteFilePath>();

  if (targetByLocalName.size === 0) {
    return { parseSites, valueTargets: [] };
  }

  const pending: { node: ts.Node; inType: boolean }[] = [{ node: sourceFile, inType: false }];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) {
      break;
    }
    const { node, inType } = current;

    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      continue;
    }

    const isPropertyName =
      !ts.isSourceFile(node) &&
      ((ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) ||
        (ts.isPropertyAssignment(node.parent) && node.parent.name === node));

    if (ts.isIdentifier(node) && !inType && !isPropertyName) {
      const target = targetByLocalName.get(node.text);
      if (target !== undefined) {
        valueTargets.add(target);
      }
    }

    const parseCallee =
      ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
        ? node.expression
        : undefined;

    if (
      parseCallee !== undefined &&
      !inType &&
      PARSE_METHOD_NAMES.some((methodName) => methodName === parseCallee.name.text)
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const receiverPending: ts.Node[] = [parseCallee.expression];
      const parsedTargets = new Set<AbsoluteFilePath>();
      while (receiverPending.length > 0) {
        const receiverNode = receiverPending.pop();
        if (receiverNode === undefined) {
          break;
        }
        const receiverIsPropertyName =
          ts.isPropertyAccessExpression(receiverNode.parent) &&
          receiverNode.parent.name === receiverNode;
        if (ts.isIdentifier(receiverNode) && !receiverIsPropertyName) {
          const target = targetByLocalName.get(receiverNode.text);
          if (target !== undefined) {
            parsedTargets.add(target);
          }
        }
        ts.forEachChild(receiverNode, (child) => {
          receiverPending.push(child);
        });
      }
      for (const targetFile of parsedTargets) {
        parseSites.push({
          targetFile,
          site: contractParseSiteContract.parse({ filePath: sourceFile.fileName, line: line + 1 }),
        });
      }
    }

    ts.forEachChild(node, (child) => {
      pending.push({ node: child, inType: inType || ts.isTypeNode(child) });
    });
  }

  return { parseSites, valueTargets: [...valueTargets] };
};

/**
 * PURPOSE: Finds, in one file, every parse call built from one of the candidate names and every
 * value mention of one, by local name — the file-local half of the contract index's use scan; which
 * contract file a name lands on is resolved later, across files. A parse is `.parse`, `.safeParse`,
 * `.parseAsync` or `.safeParseAsync` called on an expression built from the name
 * (`xContract.shape.id.parse`, `z.array(xContract).parse`); a value use is any mention outside a type
 * position. A parse names a candidate as WHOLE unless it is reached only through `.shape`
 * (`xContract.shape.id.parse` parses one field, never the object). Names keep first-seen order.
 *
 * USAGE:
 * contractUsesScanLayerTransformer({ sourceFile, candidateNames: ['thingContract'] });
 * // Returns { parseCalls: [{ line, parsedNames, wholeNames }], valueNames }
 */
import * as ts from '#gateway/npm/typescript';

import { contractIndexFileReadContract } from '../../contracts/contract-index-file-read/contract-index-file-read-contract';
import type { ContractIndexFileRead } from '../../contracts/contract-index-file-read/contract-index-file-read-contract';
import { contractIndexStatics } from '../../statics/contract-index/contract-index-statics';

const PARSE_METHOD_NAMES = contractIndexStatics.parse.methodNames;

export const contractUsesScanLayerTransformer = ({
  sourceFile,
  candidateNames,
}: {
  sourceFile: ts.SourceFile;
  candidateNames: readonly string[];
}): Pick<ContractIndexFileRead, 'parseCalls' | 'valueNames'> => {
  const candidates = new Set(candidateNames);
  const parseCalls: { line: number; parsedNames: string[]; wholeNames: string[] }[] = [];
  const valueNames = new Set<string>();

  if (candidates.size === 0) {
    return {
      parseCalls: contractIndexFileReadContract.shape.parseCalls.parse(parseCalls),
      valueNames: contractIndexFileReadContract.shape.valueNames.parse([]),
    };
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
      if (candidates.has(node.text)) {
        valueNames.add(node.text);
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
      const parsedNames = new Set<string>();
      const wholeNames = new Set<string>();
      while (receiverPending.length > 0) {
        const receiverNode = receiverPending.pop();
        if (receiverNode === undefined) {
          break;
        }
        const receiverIsPropertyName =
          ts.isPropertyAccessExpression(receiverNode.parent) &&
          receiverNode.parent.name === receiverNode;
        if (ts.isIdentifier(receiverNode) && !receiverIsPropertyName) {
          if (candidates.has(receiverNode.text)) {
            parsedNames.add(receiverNode.text);
            const isFieldReach =
              ts.isPropertyAccessExpression(receiverNode.parent) &&
              receiverNode.parent.expression === receiverNode &&
              receiverNode.parent.name.text === 'shape';
            if (!isFieldReach) {
              wholeNames.add(receiverNode.text);
            }
          }
        }
        ts.forEachChild(receiverNode, (child) => {
          receiverPending.push(child);
        });
      }
      if (parsedNames.size > 0) {
        parseCalls.push({
          line: line + 1,
          parsedNames: [...parsedNames],
          wholeNames: [...wholeNames],
        });
      }
    }

    ts.forEachChild(node, (child) => {
      pending.push({ node: child, inType: inType || ts.isTypeNode(child) });
    });
  }

  return {
    parseCalls: contractIndexFileReadContract.shape.parseCalls.parse(parseCalls),
    valueNames: contractIndexFileReadContract.shape.valueNames.parse([...valueNames]),
  };
};

/**
 * PURPOSE: Answers whether a top-level statement carries TypeScript's own `export` modifier — the
 * one AST check every local-export detection in this folder needs, so it lives once rather than
 * being re-walked per statement kind.
 *
 * USAGE:
 * hasExportModifierLayerTransformer({ node: someVariableStatement });
 * // Returns: true when the statement is written as `export const ...`
 */

import * as ts from '#gateway/npm/typescript';

export const hasExportModifierLayerTransformer = ({ node }: { node: ts.Node }): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

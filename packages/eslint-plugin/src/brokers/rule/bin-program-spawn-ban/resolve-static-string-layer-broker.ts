/**
 * PURPOSE: Resolves an AST node to the plain string it statically evaluates to, when that is cheaply
 * decidable from the SAME module alone — a string literal, a template literal's static leading
 * segment, a module-level `const` the identifier names, or one property of a module-level `const`
 * object literal (`const lsofStatics = {command: 'lsof'} as const;` then `lsofStatics.command`),
 * or — when the caller passes the linted `filename` — one property of an object imported by name
 * from a relative path (`resolveImportedStaticsLayerBroker` owns what that can and cannot read).
 * A value computed at runtime, or an import that layer cannot read, is deliberately NOT resolved —
 * this returns `undefined` rather than guess, so `resolveSpawnedProgramLayerBroker` fails open on it,
 * per the design doc's own "commands built at runtime are allowed" rule.
 *
 * USAGE:
 * resolveStaticStringLayerBroker({ node: literalNode, moduleBody: programBody });
 * // Returns 'git' as ContentText, or undefined when the node is not statically resolvable this way
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { objectPropertyValueTransformer } from '../../../transformers/object-property-value/object-property-value-transformer';
import { findModuleConstInitLayerBroker } from './find-module-const-init-layer-broker';
import { resolveImportedStaticsLayerBroker } from './resolve-imported-statics-layer-broker';

export const resolveStaticStringLayerBroker = ({
  node,
  moduleBody,
  filename,
}: {
  node: TSESTree.Node | undefined;
  moduleBody: readonly TSESTree.ProgramStatement[];
  filename?: string | undefined;
}): ContentText | undefined => {
  if (node === undefined) {
    return undefined;
  }

  // `as const`/`as Type` wraps the real expression one level down — a `const lsofStatics = {
  // command: 'lsof' } as const;`'s init is a TSAsExpression, not the ObjectExpression itself.
  if (node.type === AST_NODE_TYPES.TSAsExpression) {
    return resolveStaticStringLayerBroker({
      node: node.expression,
      moduleBody,
      filename,
    });
  }

  if (node.type === AST_NODE_TYPES.Literal) {
    return typeof node.value === 'string' ? contentTextContract.parse(node.value) : undefined;
  }

  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    const [firstQuasi] = node.quasis;
    const text = firstQuasi?.value.cooked;
    return text !== undefined && text.length > 0 ? contentTextContract.parse(text) : undefined;
  }

  if (node.type === AST_NODE_TYPES.Identifier) {
    return resolveStaticStringLayerBroker({
      node: findModuleConstInitLayerBroker({ name: node.name, moduleBody }),
      moduleBody,
      filename,
    });
  }

  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.object.type === AST_NODE_TYPES.Identifier &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    const rawObjectInit = findModuleConstInitLayerBroker({
      name: node.object.name,
      moduleBody,
    });
    if (rawObjectInit === undefined) {
      return filename === undefined
        ? undefined
        : resolveImportedStaticsLayerBroker({
            objectName: node.object.name,
            propertyName: node.property.name,
            moduleBody,
            filename,
          });
    }
    // Unwrap a `... as const`/`... as Type` wrapper — the object literal sits one level down.
    const objectInit =
      rawObjectInit.type === AST_NODE_TYPES.TSAsExpression
        ? rawObjectInit.expression
        : rawObjectInit;
    if (objectInit.type !== AST_NODE_TYPES.ObjectExpression) {
      return undefined;
    }
    return resolveStaticStringLayerBroker({
      node: objectPropertyValueTransformer({
        properties: objectInit.properties,
        name: node.property.name,
      }),
      moduleBody,
      filename,
    });
  }

  return undefined;
};

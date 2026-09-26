/**
 * PURPOSE: Resolves an AST node to the plain string it statically evaluates to, when that is cheaply
 * decidable from the SAME module alone — a string literal, a template literal's static leading
 * segment, a module-level `const` the identifier names, or one property of a module-level `const`
 * object literal (`const lsofStatics = {command: 'lsof'} as const;` then `lsofStatics.command`).
 * Anything requiring cross-file resolution (an imported statics object's property, a value computed
 * at runtime) is deliberately NOT resolved — this returns `undefined` rather than guess, so
 * `resolveSpawnedProgramLayerBroker` fails open on it, per the design doc's own "commands built at
 * runtime are allowed" rule.
 *
 * USAGE:
 * resolveStaticStringLayerBroker({ node: literalNode, moduleBody: programBody });
 * // Returns 'git' as ContentText, or undefined when the node is not statically resolvable this way
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { objectPropertyValueTransformer } from '../../../transformers/object-property-value/object-property-value-transformer';
import { findModuleConstInitLayerBroker } from './find-module-const-init-layer-broker';

export const resolveStaticStringLayerBroker = ({
  node,
  moduleBody,
}: {
  node: Tsestree | undefined;
  moduleBody: readonly Tsestree[];
}): ContentText | undefined => {
  if (node === undefined) {
    return undefined;
  }

  // `as const`/`as Type` wraps the real expression one level down — a `const lsofStatics = {
  // command: 'lsof' } as const;`'s init is a TSAsExpression, not the ObjectExpression itself.
  if (node.type === 'TSAsExpression') {
    return resolveStaticStringLayerBroker({ node: node.expression ?? undefined, moduleBody });
  }

  if (node.type === 'Literal') {
    return typeof node.value === 'string' ? contentTextContract.parse(node.value) : undefined;
  }

  if (node.type === 'TemplateLiteral') {
    const [firstQuasi] = node.quasis ?? [];
    const quasiValue = firstQuasi?.value;
    const cooked =
      quasiValue !== null && typeof quasiValue === 'object' && 'cooked' in quasiValue
        ? quasiValue.cooked
        : undefined;
    const raw =
      quasiValue !== null && typeof quasiValue === 'object' && 'raw' in quasiValue
        ? quasiValue.raw
        : undefined;
    const text = typeof cooked === 'string' ? cooked : raw;
    return typeof text === 'string' && text.length > 0
      ? contentTextContract.parse(text)
      : undefined;
  }

  if (node.type === 'Identifier' && node.name !== undefined) {
    return resolveStaticStringLayerBroker({
      node: findModuleConstInitLayerBroker({ name: String(node.name), moduleBody }),
      moduleBody,
    });
  }

  if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.object?.type === 'Identifier' &&
    node.property?.type === 'Identifier'
  ) {
    const rawObjectInit = findModuleConstInitLayerBroker({
      name: String(node.object.name),
      moduleBody,
    });
    // Unwrap a `... as const`/`... as Type` wrapper — the object literal sits one level down.
    const objectInit =
      rawObjectInit?.type === 'TSAsExpression'
        ? (rawObjectInit.expression ?? undefined)
        : rawObjectInit;
    if (objectInit?.type !== 'ObjectExpression') {
      return undefined;
    }
    return resolveStaticStringLayerBroker({
      node: objectPropertyValueTransformer({
        properties: objectInit.properties ?? [],
        name: String(node.property.name),
      }),
      moduleBody,
    });
  }

  return undefined;
};

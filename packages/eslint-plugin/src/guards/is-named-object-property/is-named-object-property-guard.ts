/**
 * PURPOSE: Tells whether an AST `Property` node is a non-computed, statically-named property whose
 * key matches `name` — the shape check `{command: 'git'}` or `{args: [...]}` needs before reading
 * either side of it. Reach for this over hand-rolling the `key.type`/`computed` check inline, since
 * `bin-program-spawn-ban`'s options-object reader and its module-const-object reader both need the
 * identical predicate.
 *
 * USAGE:
 * isNamedObjectPropertyGuard({ property: commandPropertyNode, name: 'command' });
 * // Returns true when property is `command: ...` and not `[command]: ...`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isNamedObjectPropertyGuard = ({
  property,
  name,
}: {
  property?: TSESTree.Node | undefined;
  name?: string | undefined;
}): boolean => {
  if (property === undefined || name === undefined) {
    return false;
  }

  return (
    property.type === AST_NODE_TYPES.Property &&
    !property.computed &&
    property.key.type === AST_NODE_TYPES.Identifier &&
    property.key.name === name
  );
};

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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isNamedObjectPropertyGuard = ({
  property,
  name,
}: {
  property?: Tsestree | undefined;
  name?: string | undefined;
}): boolean => {
  if (property === undefined || name === undefined) {
    return false;
  }

  return (
    property.type === 'Property' &&
    !property.computed &&
    property.key?.type === 'Identifier' &&
    String(property.key.name) === name
  );
};

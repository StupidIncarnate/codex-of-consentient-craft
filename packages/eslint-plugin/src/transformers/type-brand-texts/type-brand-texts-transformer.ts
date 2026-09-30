/**
 * PURPOSE: Reads the brand names a `ts.Type` carries, from the type checker: zod's `.brand<'Name'>()`
 * adds a `$brand` property whose own keys are the names, so the keys are read off that property, never
 * matched out of `typeToString` text. A union gives every member's names, an intersection (`.brand`
 * twice) gives each name it stacks, and a type with no `$brand` property, such as a plain string, gives
 * none. `ban-id-rebrand` reads it for the argument being parsed and for the parse's own output.
 *
 * USAGE:
 * typeBrandTextsTransformer({ checker, type });
 * // Returns ['WorkItemId'] for `string & $brand<'WorkItemId'>`, ['A', 'B'] for `A | B`, [] for `string`
 */
import type * as ts from '#gateway/npm/typescript';

export const typeBrandTextsTransformer = ({
  checker,
  type,
}: {
  checker: ReturnType<ts.Program['getTypeChecker']>;
  type: ts.Type;
}): string[] => {
  if (type.isUnion()) {
    return [
      ...new Set(
        type.types.flatMap((member) => typeBrandTextsTransformer({ checker, type: member })),
      ),
    ];
  }

  // The `$brand` symbol is a unique symbol, so the property's escaped name is `__@$brand@<id>`.
  const brandProperty = type.getProperties().find((property) => property.name.includes('$brand'));

  if (brandProperty === undefined) {
    return [];
  }

  return checker
    .getTypeOfSymbol(brandProperty)
    .getProperties()
    .map((nameProperty) => nameProperty.name);
};

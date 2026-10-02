/**
 * PURPOSE: Answers whether a declaration-file symbol is marked `@deprecated`, following an
 * `export import` alias to the symbol it names first, since the tag sits on that declaration and not
 * on the alias. Reach for this when deciding which names a generated passthrough re-exports: a
 * deprecated one is a `@typescript-eslint/no-deprecated` error in the consumer's own gateway.
 *
 * USAGE:
 * isDeprecatedSymbolGuard({ symbol, checker });
 * // Returns true for `/** @deprecated *\/ export const old = 1;`, false for an untagged export
 */
import * as ts from '#gateway/npm/typescript';

export const isDeprecatedSymbolGuard = ({
  symbol,
  checker,
}: {
  symbol?: ts.Symbol;
  checker?: ts.TypeChecker;
}): boolean => {
  if (symbol === undefined || checker === undefined) {
    return false;
  }

  // An `export { a as b }` or `export import b = a` symbol carries the alias flag alone.
  const target = symbol.flags === ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;

  return target.getJsDocTags(checker).some((tag) => tag.name === 'deprecated');
};

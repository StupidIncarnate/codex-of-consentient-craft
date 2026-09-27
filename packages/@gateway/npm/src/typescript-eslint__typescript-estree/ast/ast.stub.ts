/**
 * PURPOSE: A real, parsed `Program`, built by actually calling `@typescript-eslint/typescript-estree`'s
 * own `parse()` — never a hand-typed AST standing in for what the real parser would produce. The
 * same real parse `parseAndFindNode` already depends on; this stub returns the whole `Program`
 * rather than one located node.
 *
 * USAGE:
 * const ast = AstStub();
 * // Returns the real Program AST for a small default snippet
 */
import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/utils';

export const AstStub = ({ code = 'const a = 1;' }: { code?: string } = {}): TSESTree.Program =>
  parse(code, { range: true, loc: true });

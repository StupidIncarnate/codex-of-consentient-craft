/**
 * PURPOSE: Parses a code sample with the real `@typescript-eslint/typescript-estree` parser and
 * returns the first node of the given `AST_NODE_TYPES` member — never a hand-built object cast to
 * a `TSESTree` type, which is exactly the shape BR C5 refuses (a `CallExpression` with no
 * `arguments`, for example, something the real parser never emits). Every node stub in this
 * subpath calls this with its own default code sample and its own `nodeType`. The return type is
 * computed FROM `nodeType` (`Extract<TSESTree.Node, {type: K}>`), a real type this function
 * derives from an input — not a bare, caller-invented type parameter, which
 * `gateway-return-unknown-not-caller-type` refuses.
 *
 * Parses through `@typescript-eslint/typescript-estree` directly, not `@typescript-eslint/parser`
 * (which wraps the same parse under an ESLint-shaped result): calling `@typescript-eslint/parser`'s
 * own `parse` here resolves to TypeScript's internal `error` type under this package's type-aware
 * lint pass even though `tsc --noEmit` accepts it — every existing caller of that package in this
 * repo goes through `RuleTester`/`Linter.verify` instead of calling `parse` directly, and this is
 * the first to need a bare AST, so `typescript-estree`'s own `parse` (which this file already
 * depends on for `simpleTraverse`) is both simpler and the one path proven to resolve cleanly.
 *
 * The parser itself never sets `.parent` — ESLint adds that while it walks. This walks the parsed
 * tree once with `simpleTraverse(ast, {enter}, true)`, whose third argument (`setParentPointers`)
 * is what sets `.parent` as a side effect, confirmed against the installed
 * `@typescript-eslint/typescript-estree` build rather than assumed.
 *
 * `jsx` is a plain flag, not a default: turning JSX on globally would change how ordinary
 * (non-JSX) code parses, so only the stubs that need it (`JSXElement`, `JSXFragment`) pass it, and
 * only together with a `.tsx` `filePath` — `typescript-estree`'s own `jsx` option is a no-op for
 * known extensions (`.ts` forces JSX off regardless of this flag, confirmed against the installed
 * build). Loading the parser costs about 250ms once per test file; the parse plus the walk after it
 * is under a millisecond once it is warm — a fixed, one-time cost of testing against a real parsed
 * value, not something a per-file Jest module cache can amortize.
 *
 * USAGE:
 * const node = parseAndFindNode({ code: 'foo(a);', nodeType: AST_NODE_TYPES.CallExpression });
 * // Returns the real, parented CallExpression for 'foo(a)'
 */
import { parse, simpleTraverse } from '@typescript-eslint/typescript-estree';
import type { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const JSX_SAMPLE_FILE_PATH = 'gateway-stub-sample.tsx';

type NodeOfType<K extends AST_NODE_TYPES> = Extract<TSESTree.Node, { type: K }>;

export const parseAndFindNode = <K extends AST_NODE_TYPES>({
  code,
  nodeType,
  jsx = false,
}: {
  code: string;
  nodeType: K;
  jsx?: boolean;
}): NodeOfType<K> => {
  const ast = parse(
    code,
    jsx
      ? { range: true, loc: true, jsx: true, filePath: JSX_SAMPLE_FILE_PATH }
      : { range: true, loc: true },
  );

  const matchedNodes: NodeOfType<K>[] = [];

  simpleTraverse(
    ast,
    {
      enter: (node): void => {
        if (matchedNodes.length === 0 && node.type === nodeType) {
          matchedNodes.push(node as NodeOfType<K>);
        }
      },
    },
    true,
  );

  const [found] = matchedNodes;

  if (found === undefined) {
    throw new Error(`parseAndFindNode: no ${nodeType} node found in code: ${code}`);
  }

  return found;
};

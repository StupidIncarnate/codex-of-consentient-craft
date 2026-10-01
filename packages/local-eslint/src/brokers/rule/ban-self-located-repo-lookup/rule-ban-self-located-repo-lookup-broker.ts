/**
 * PURPOSE: Flags a call to a repo-root, scope, workspace or config resolver whose arguments come
 * from the calling module's own location (`__dirname`, `__filename`, `import.meta`, or a same-file
 * variable built from one). A consumer that links dungeonmaster through `file:` runs dungeonmaster's
 * modules from inside the dungeonmaster checkout, so a walk that starts there finds dungeonmaster's
 * repo instead of the consumer's. `cwdResolveBroker({ kind: 'project-root' })` is let through: it
 * asks for the nearest package.json, which is how a module reads its own package's files.
 *
 * USAGE:
 * const rule = ruleBanSelfLocatedRepoLookupBroker();
 * // Returns ESLint rule that flags `repoScopeResolveBroker({ startDir: __dirname })` and stays
 * // silent on `repoScopeResolveBroker({ startDir: dirname(filename) })`
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint (this repo only, never shipped). Calls are
 * collected and checked at `Program:exit`, so a variable declared after the call still counts.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { selfLocatedRepoLookupStatics } from '../../../statics/self-located-repo-lookup/self-located-repo-lookup-statics';
import { isSelfLocatedExpressionGuard } from '../../../guards/is-self-located-expression/is-self-located-expression-guard';

export const ruleBanSelfLocatedRepoLookupBroker = (): TSESLint.RuleModule<'selfLocatedLookup'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Ban passing this module's own location (__dirname, __filename, import.meta) to a resolver that finds a repo's root, scope, workspace or config.",
    },
    messages: {
      selfLocatedLookup:
        "{{resolver}}() is given a path built from this module's own location (__dirname, __filename or import.meta). A consumer that links dungeonmaster through `file:` runs this module from inside the dungeonmaster checkout, so the walk finds dungeonmaster's repo instead of the consumer's. Pass a path from the input instead: the linted file's directory, the cwd or startDir the caller passed in, or process.cwd() in a CLI entry point.",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]>;
    const declarations = new Map<string, TSESTree.Node>();
    const resolverCalls: { node: TSESTree.CallExpression; resolver: string }[] = [];
    const { ownPackageKind } = selfLocatedRepoLookupStatics;

    return {
      VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
        if (node.id.type === AST_NODE_TYPES.Identifier && node.init !== null) {
          declarations.set(node.id.name, node.init);
        }
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        if (callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        const resolver = callee.name;
        if (selfLocatedRepoLookupStatics.resolverNames.some((name) => name === resolver)) {
          resolverCalls.push({ node, resolver });
        }
      },

      'Program:exit': (): void => {
        for (const { node, resolver } of resolverCalls) {
          const asksForOwnPackage = node.arguments.some(
            (argument) =>
              argument.type === AST_NODE_TYPES.ObjectExpression &&
              argument.properties.some(
                (property) =>
                  property.type === AST_NODE_TYPES.Property &&
                  property.key.type === AST_NODE_TYPES.Identifier &&
                  property.key.name === ownPackageKind.propertyName &&
                  property.value.type === AST_NODE_TYPES.Literal &&
                  property.value.value === ownPackageKind.value,
              ),
          );
          if (asksForOwnPackage) {
            continue;
          }

          const isSelfLocated = node.arguments.some((argument) =>
            isSelfLocatedExpressionGuard({ node: argument, declarations }),
          );
          if (isSelfLocated) {
            ctx.report({ node, messageId: 'selfLocatedLookup', data: { resolver } });
          }
        }
      },
    };
  },
});

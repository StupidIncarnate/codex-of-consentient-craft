/**
 * PURPOSE: Creates the ESLint rule that keeps a list row from being written inline. A `.map` that
 * renders must hand each item to a NAMED component, so the two things that make a row unreadable —
 * an anonymous JSX tree and the statements feeding it — are forced into a widget of their own.
 * Reach for this over a line cap on the file: a cap can be satisfied by cutting anywhere, and this
 * names the seam.
 *
 * USAGE:
 * const rule = ruleBanAnonymousJsxInMapBroker();
 * // Reports `items.map((i) => <Box><Text/></Box>)`, passes `items.map((i) => <RowWidget item={i} />)`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { arrayRenderStatics } from '../../../statics/array-render/array-render-statics';
import { isJsxStructuralChildGuard } from '../../../guards/is-jsx-structural-child/is-jsx-structural-child-guard';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleBanAnonymousJsxInMapBroker = (): TSESLint.RuleModule<
  'anonymousJsxTree' | 'declarationInMapCallback'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid an anonymous JSX tree, or a variable declaration, inside a rendering array callback',
    },
    messages: {
      anonymousJsxTree:
        'This `.map` returns an anonymous JSX tree. Move it to its own widget and call that instead — `items.map((item) => <ThingLayerWidget item={item} />)`. A tree with no name cannot be tested, reused, or found by anyone reading the list.',
      declarationInMapCallback:
        '`{{kind}} {{name}}` is declared inside a rendering `.map`. Put the value inline on the prop, or compute it above the map — a row callback that needs its own variables is a widget that has not been extracted yet.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    if (shouldExcludeFileFromProjectStructureRulesGuard({ filename })) {
      return {};
    }

    // A proxy renders scenario markup for a test, not a surface anyone reads. The exclusion guard
    // above lets proxies through deliberately, so this is a second, separate check.
    if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
      return {};
    }

    const {
      JSXElement,
      JSXFragment,
      ArrowFunctionExpression,
      FunctionExpression,
      BlockStatement,
      ReturnStatement,
      VariableDeclaration,
      MemberExpression,
      ConditionalExpression,
      LogicalExpression,
    } = AST_NODE_TYPES;

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        if (callee.type !== MemberExpression) {
          return;
        }
        const methodName =
          callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined;
        if (
          methodName === undefined ||
          !arrayRenderStatics.renderingMethods.names.some((name) => name === methodName)
        ) {
          return;
        }

        const [callback] = node.arguments;
        if (
          !callback ||
          (callback.type !== ArrowFunctionExpression && callback.type !== FunctionExpression)
        ) {
          return;
        }

        // An arrow with a block body carries its statements on the BlockStatement; an expression
        // body IS the result. Normalising both to a statement list and a result list keeps the two
        // checks below from each having to know which shape they got.
        const body = Array.isArray(callback.body) ? undefined : callback.body;
        const isBlock = body?.type === BlockStatement;
        const statements = isBlock && Array.isArray(body.body) ? body.body : [];
        const results = isBlock
          ? statements
              .filter((statement) => statement.type === ReturnStatement)
              .map((statement) => statement.argument)
          : [body];

        // A ternary is allowed to CHOOSE the element, so its branches are candidates too.
        const candidates = results.flatMap((result) =>
          result
            ? result.type === ConditionalExpression || result.type === LogicalExpression
              ? [
                  result.type === AST_NODE_TYPES.ConditionalExpression
                    ? result.consequent
                    : undefined,
                  result.type === AST_NODE_TYPES.ConditionalExpression
                    ? result.alternate
                    : undefined,
                  result.type === AST_NODE_TYPES.LogicalExpression ? result.right : undefined,
                ]
              : [result]
            : [],
        );

        const rendersJsx = candidates.some(
          (candidate) =>
            !Array.isArray(candidate) &&
            (candidate?.type === JSXElement || candidate?.type === JSXFragment),
        );
        if (!rendersJsx) {
          return;
        }

        candidates.forEach((candidate) => {
          if (Array.isArray(candidate) || !candidate) {
            return;
          }
          if (candidate.type === JSXFragment) {
            ctx.report({ node: candidate, messageId: 'anonymousJsxTree' });
            return;
          }
          if (candidate.type !== JSXElement) {
            return;
          }
          const hasStructure = candidate.children.some((child) =>
            isJsxStructuralChildGuard({ child }),
          );
          if (hasStructure) {
            ctx.report({ node: candidate, messageId: 'anonymousJsxTree' });
          }
        });

        statements.forEach((statement) => {
          if (statement.type !== VariableDeclaration) {
            return;
          }
          ctx.report({
            node: statement,
            messageId: 'declarationInMapCallback',
            data: {
              kind: statement.kind,
              name:
                (statement.declarations[0].id.type === AST_NODE_TYPES.Identifier
                  ? statement.declarations[0].id.name
                  : undefined) ?? 'value',
            },
          });
        });
      },
    };
  },
});

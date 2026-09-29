/**
 * PURPOSE: Enforces that implementation files have metadata comments with PURPOSE and USAGE fields
 *
 * USAGE:
 * const rule = ruleEnforceFileMetadataBroker();
 * // Returns ESLint rule that requires implementation files to have PURPOSE: ... USAGE: ...
 **/
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isImplementationFileGuard } from '../../../guards/is-implementation-file/is-implementation-file-guard';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { extractFileMetadataTransformer } from '../../../transformers/extract-file-metadata/extract-file-metadata-transformer';

export const ruleEnforceFileMetadataBroker = (): TSESLint.RuleModule<
  'missingMetadata' | 'metadataNotBeforeImports'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce file metadata comments with PURPOSE and USAGE fields in implementation files',
    },
    messages: {
      missingMetadata:
        'Implementation file must have a metadata comment with PURPOSE and USAGE fields. Example:\n\n/**\n * PURPOSE: [One-line description]\n *\n * USAGE:\n * [Code example]\n * // [Comment explaining return]\n *\n */',
      metadataNotBeforeImports: 'Metadata comment must appear before all import statements.',
    },
    schema: [],
    fixable: 'code',
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // PRE-VALIDATION: Exclude files outside src/ (root barrels, config, etc.) from structure
    // validation. A gateway package's files sit under a real src/, so this guard reads them as
    // in-scope — the header rule already applies to gateway wrappers with no extra handling.
    if (shouldExcludeFileFromProjectStructureRulesGuard({ filename })) {
      return {};
    }

    // Only check implementation files (single-dot, not .test.ts, .proxy.ts, etc.)
    if (!isImplementationFileGuard({ filename })) {
      return {};
    }

    return {
      // Check comments once at Program level
      Program: (node: TSESTree.Program): void => {
        const allComments = ctx.sourceCode.getAllComments();

        // Find the first comment with valid metadata
        let metadataComment = null;
        for (const comment of allComments) {
          if (typeof comment.value === 'string') {
            const metadata = extractFileMetadataTransformer({ commentText: comment.value });
            if (metadata !== null) {
              metadataComment = comment;
              break;
            }
          }
        }

        // No metadata found at all
        if (!metadataComment) {
          ctx.report({ node, messageId: 'missingMetadata' });
          return;
        }

        // Find first import declaration in the AST
        const { body } = node;
        let firstImport = null;
        if (Array.isArray(body)) {
          for (const statement of body) {
            if (
              statement.type === AST_NODE_TYPES.ImportDeclaration ||
              statement.type === AST_NODE_TYPES.TSImportEqualsDeclaration
            ) {
              firstImport = statement;
              break;
            }
          }
        }

        // No imports - metadata can be anywhere
        if (!firstImport) {
          return;
        }

        // Metadata comes after import - report with fixer
        if (metadataComment.range[0] > firstImport.range[0]) {
          ctx.report({
            node,
            messageId: 'metadataNotBeforeImports',
            fix: (fixer) => {
              const commentText = ctx.sourceCode.getText(metadataComment);
              const removalRange = metadataComment.range;
              const sourceText = ctx.sourceCode.getText();
              const [startPos, originalEndPos] = removalRange;
              const endPos =
                originalEndPos < sourceText.length && sourceText[originalEndPos] === '\n'
                  ? originalEndPos + 1
                  : originalEndPos;

              return [
                fixer.insertTextBeforeRange([0, 0], `${commentText}\n`),
                fixer.removeRange([startPos, endPos]),
              ];
            },
          });
        }
      },
    };
  },
});

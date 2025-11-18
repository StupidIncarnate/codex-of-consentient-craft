/**
 * PURPOSE: Enforces that implementation files have metadata comments with PURPOSE and USAGE fields
 *
 * USAGE:
 * const rule = ruleEnforceFileMetadataBroker();
 * // Returns ESLint rule that requires implementation files to have PURPOSE: ... USAGE: ...
 **/
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isImplementationFileGuard } from '../../../guards/is-implementation-file/is-implementation-file-guard';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { extractFileMetadataTransformer } from '../../../transformers/extract-file-metadata/extract-file-metadata-transformer';

export const ruleEnforceFileMetadataBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const { filename } = ctx;

    // PRE-VALIDATION: Exclude files from structure validation
    if (shouldExcludeFileFromProjectStructureRulesGuard({ filename: filename ?? '' })) {
      return {};
    }

    // Only check implementation files (single-dot, not .test.ts, .proxy.ts, etc.)
    if (!isImplementationFileGuard({ filename: filename ?? '' })) {
      return {};
    }

    return {
      // Check comments once at Program level
      Program: (node: Tsestree): void => {
        const RANGE_TUPLE_LENGTH = 2;
        const allComments = ctx.sourceCode?.getAllComments() ?? [];

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
              statement.type === 'ImportDeclaration' ||
              statement.type === 'TSImportEqualsDeclaration'
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

        // Validate ranges
        const commentRange = metadataComment.range;
        const importRange = firstImport.range;
        if (
          !commentRange ||
          !importRange ||
          !Array.isArray(commentRange) ||
          !Array.isArray(importRange) ||
          commentRange.length !== RANGE_TUPLE_LENGTH ||
          typeof commentRange[0] !== 'number' ||
          typeof importRange[0] !== 'number'
        ) {
          return;
        }

        // Metadata comes after import - report with fixer
        if (commentRange[0] > importRange[0] && ctx.sourceCode) {
          ctx.report({
            node,
            messageId: 'metadataNotBeforeImports',
            fix: (fixer) => {
              if (!ctx.sourceCode) {
                return null;
              }
              const commentText = ctx.sourceCode.getText(metadataComment);
              const removalRange = metadataComment.range;
              const sourceText = ctx.sourceCode.getText();

              if (
                typeof sourceText !== 'string' ||
                !Array.isArray(removalRange) ||
                removalRange.length !== RANGE_TUPLE_LENGTH ||
                typeof removalRange[0] !== 'number' ||
                typeof removalRange[1] !== 'number'
              ) {
                return null;
              }

              const { 0: startPos, 1: originalEndPos } = removalRange;
              const endPos =
                originalEndPos < sourceText.length && sourceText[originalEndPos] === '\n'
                  ? originalEndPos + 1
                  : originalEndPos;

              return [
                fixer.insertTextBeforeRange([0, 0], `${String(commentText)}\n`),
                fixer.removeRange([startPos, endPos]),
              ];
            },
          });
        }
      },
    };
  },
});

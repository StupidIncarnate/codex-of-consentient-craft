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
        metadataNotAtTop:
          'Metadata comment must be at the very top of the file, before all imports and code.',
      },
      schema: [],
      fixable: 'code',
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const { filename } = ctx;

    // Only check implementation files (single-dot, not .test.ts, .proxy.ts, etc.)
    if (!isImplementationFileGuard({ filename: filename ?? '' })) {
      return {};
    }

    return {
      // Check comments once at Program level
      Program: (node: Tsestree): void => {
        // ESLint range is always a tuple of [start, end]
        const RANGE_TUPLE_LENGTH = 2;

        // Get all comments in the file
        const allComments = ctx.sourceCode?.getAllComments() ?? [];

        // Find the first comment with valid metadata
        let metadataCommentIndex = -1;
        let metadataComment = null;

        for (let i = 0; i < allComments.length; i++) {
          const comment = allComments[i];
          if (!comment) {
            continue;
          }

          const commentValue = comment.value;

          if (typeof commentValue !== 'string') {
            continue;
          }

          const metadata = extractFileMetadataTransformer({ commentText: commentValue });
          if (metadata !== null) {
            metadataCommentIndex = i;
            metadataComment = comment;
            break;
          }
        }

        // No metadata found at all
        if (metadataCommentIndex === -1 || !metadataComment) {
          ctx.report({
            node,
            messageId: 'missingMetadata',
          });
          return;
        }

        // Check if metadata comment is at the very top of the file (position 0)
        // ESLint comment ranges are [start, end] positions in the source code
        const commentRange = metadataComment.range;
        const isCommentRangeValid =
          typeof commentRange === 'object' &&
          commentRange !== null &&
          Array.isArray(commentRange) &&
          commentRange.length === RANGE_TUPLE_LENGTH;

        if (!isCommentRangeValid) {
          // Can't determine position, skip fix check
          return;
        }

        const { 0: commentStartPos } = commentRange;

        // Metadata exists but is not at the very top of the file
        if (typeof commentStartPos === 'number' && commentStartPos > 0 && ctx.sourceCode) {
          ctx.report({
            node,
            messageId: 'metadataNotAtTop',
            fix: (fixer) => {
              if (!ctx.sourceCode) {
                return null;
              }

              // Get the comment text including delimiters
              const commentText = ctx.sourceCode.getText(metadataComment);
              if (typeof commentText !== 'string') {
                return null;
              }

              // Get the range of the metadata comment for removal
              const removalRange = metadataComment.range;
              if (typeof removalRange !== 'object' || removalRange === null) {
                return null;
              }

              // Type guard for range tuple
              if (!Array.isArray(removalRange) || removalRange.length !== RANGE_TUPLE_LENGTH) {
                return null;
              }

              // Validate array elements are numbers before extracting
              if (typeof removalRange[0] !== 'number' || typeof removalRange[1] !== 'number') {
                return null;
              }

              const { 0: startPos, 1: originalEndPos } = removalRange;

              // Remove the comment from its current location (including trailing newline if present)
              const sourceText = ctx.sourceCode.getText();
              if (typeof sourceText !== 'string') {
                return null;
              }

              let endPos = originalEndPos;

              // Check if there's a newline after the comment and include it in removal
              if (endPos < sourceText.length && sourceText[endPos] === '\n') {
                endPos += 1;
              }

              // Insert at position 0 and remove from current position
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

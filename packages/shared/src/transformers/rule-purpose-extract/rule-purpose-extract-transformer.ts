/**
 * PURPOSE: Extracts the PURPOSE doc-comment line from a TypeScript source file.
 * Matches the pattern `* PURPOSE: <text>` at the top of the file.
 *
 * USAGE:
 * const purpose = rulePurposeExtractTransformer({
 *   source: ContentTextStub({ value: '/** \n * PURPOSE: Bans raw primitives\n *\/' }),
 * });
 * // Returns ContentText('Bans raw primitives') or undefined if not found
 *
 * WHEN-TO-USE: eslint-plugin headline broker extracting rule purpose for the exemplar section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const PURPOSE_LINE_PATTERN = /\*\s*PURPOSE:\s*([^\n]+)/u;

export const rulePurposeExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | undefined => {
  const match = PURPOSE_LINE_PATTERN.exec(String(source));
  if (match === null) {
    return undefined;
  }
  const purposeText = (match[1] ?? '').trim();
  if (purposeText.length === 0) {
    return undefined;
  }
  return contentTextContract.parse(purposeText);
};

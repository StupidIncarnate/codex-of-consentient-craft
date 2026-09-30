/**
 * PURPOSE: Estimates the token count for a string of content based on a characters-per-token heuristic
 *
 * USAGE:
 * estimateContentTokensTransformer({content: 'some long text...'});
 * // Returns ContextTokenCount branded number
 */

import { tokenFormatConfigStatics } from '../../statics/token-format-config/token-format-config-statics';

export const estimateContentTokensTransformer = ({ content }: { content: string }): number =>
  Math.ceil(content.length / tokenFormatConfigStatics.charsPerTokenEstimate);

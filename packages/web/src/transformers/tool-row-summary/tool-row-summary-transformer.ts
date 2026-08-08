/**
 * PURPOSE: Builds the dim right-hand half of a collapsed tool row — the arguments, once the label
 * has said what the call was. Everything here trades exactness for width on purpose: paths lose
 * their middles, long input gets cut. That makes it the wrong source for any reader who needs the
 * real arguments; the row's expanded detail renders `formatToolInputTransformer` output untouched
 * for exactly that reason.
 *
 * USAGE:
 * toolRowSummaryTransformer({toolName: 'Read', toolInput: '{"file_path":"packages/web/src/a/b.ts"}'});
 * // Returns 'web/…/b.ts'
 */

import { shortenedPathTextContract } from '../../contracts/shortened-path-text/shortened-path-text-contract';
import type { ShortenedPathText } from '../../contracts/shortened-path-text/shortened-path-text-contract';
import { toolDisplayLabelStatics } from '../../statics/tool-display-label/tool-display-label-statics';
import { toolRowSummaryStatics } from '../../statics/tool-row-summary/tool-row-summary-statics';
import { formatToolInputTransformer } from '../format-tool-input/format-tool-input-transformer';
import { shortenPathsTransformer } from '../shorten-paths/shorten-paths-transformer';

export const toolRowSummaryTransformer = ({
  toolName,
  toolInput,
}: {
  toolName: string;
  toolInput: string;
}): ShortenedPathText => {
  const formatted = formatToolInputTransformer({ toolName, toolInput });
  const isSkill = toolName === toolDisplayLabelStatics.skillToolName;

  const allFields = formatted === null ? [] : formatted.fields;

  // The skill name is already in the label, so repeating it here would spend width on nothing.
  const fields = isSkill
    ? allFields.filter((field) => field.key !== toolDisplayLabelStatics.skillFieldKey)
    : allFields;

  // A single-value tool shows its argument bare, with no `key:` — which means the field picked has
  // to carry meaning ALONE. A flag never does: "false" names no file and identifies no call. So the
  // pick skips bare booleans rather than trusting field order, and a tool whose input is nothing
  // but flags falls through to the labelled form, where at least the key says what the flag was.
  const primaryField = fields.find((field) => field.value !== 'true' && field.value !== 'false');
  const isSingleValue =
    !isSkill && toolRowSummaryStatics.singleValueTools.some((tool) => tool === toolName);

  const joined = fields
    .map((field) => `${field.key}: ${field.value}`)
    .join(toolRowSummaryStatics.fieldSeparator);
  const fromFields =
    isSingleValue && primaryField !== undefined ? String(primaryField.value) : joined;

  // Input that did not parse into fields is still worth showing raw — minus the empty-object case,
  // which is a tool called with no arguments and has nothing to say.
  const isEmptyInput = toolInput === '{}' || toolInput === '';
  const raw = allFields.length > 0 ? fromFields : isEmptyInput ? '' : toolInput;

  // Shorten before truncating: the elision is what buys the room, so a path-heavy summary shows
  // several arguments where the raw form would have been cut off inside the first one.
  const shortened = String(shortenPathsTransformer({ text: raw }));

  return shortenedPathTextContract.parse(
    shortened.length > toolRowSummaryStatics.inlineSummaryLimit
      ? `${shortened.slice(0, toolRowSummaryStatics.inlineSummaryLimit)}${toolRowSummaryStatics.truncationSuffix}`
      : shortened,
  );
};

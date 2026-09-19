/**
 * PURPOSE: Replaces every `{step.row.field}` reference in a text string with its resolved value
 * from earlier step outputs in this run. If references are found when no outputs exist yet,
 * throws an error indicating that nothing has been named yet.
 *
 * USAGE:
 * stepRefSubstituteTransformer({
 *   text: ContentTextStub({ value: '/{g.guild.urlSlug}' }),
 *   outputs: { g: { guild: { urlSlug: 'siege-guild' } } },
 * });
 * // Returns '/siege-guild' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { stepRefResolveTransformer } from '../step-ref-resolve/step-ref-resolve-transformer';

export const stepRefSubstituteTransformer = ({
  text,
  outputs,
}: {
  text: ContentText;
  outputs: Record<PropertyKey, Record<PropertyKey, unknown>>;
}): ContentText => {
  if (!text.includes('{') || !text.includes('}')) {
    return text;
  }
  const parts = text.split('{');
  const [firstPart, ...remainingParts] = parts;
  const resolvedRemaining = remainingParts.map((part) => {
    const braceIndex = part.indexOf('}');
    if (braceIndex === -1) {
      return `{${part}`;
    }
    const refBody = part.slice(0, braceIndex);
    const rest = part.slice(braceIndex + 1);
    const match = `{${refBody}}`;
    if (Object.keys(outputs).length === 0) {
      throw new Error(`cannot resolve reference ${match} — nothing has been named yet`);
    }
    const resolved = stepRefResolveTransformer({ ref: match, outputs });
    return `${resolved}${rest}`;
  });
  return contentTextContract.parse([firstPart, ...resolvedRemaining].join(''));
};

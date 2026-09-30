/**
 * PURPOSE: Reads which owner field a property reuses from the property's source text, whether
 * written plainly (`questId: questContract.shape.id`) or as the getter a cycle needs
 * (`get questId(): … { return questContract.shape.id; }`). Reach for this over
 * propertyReusedIdOwnerTransformer when the key may be something other than `id`.
 *
 * USAGE:
 * propertyReusedFieldTransformer({ text: 'guildSlug: guildContract.shape.slug' });
 * // Returns 'guildContract.shape.slug'; null for 'guildSlug: z.string()'
 */

const PLAIN_TEXT = /^[A-Za-z0-9_]+\s*:\s*([A-Za-z0-9_]+Contract\.shape\.[A-Za-z0-9_]+)\b/u;
const GETTER_TEXT = /^get\s[\s\S]*return\s+([A-Za-z0-9_]+Contract\.shape\.[A-Za-z0-9_]+)\b/u;

export const propertyReusedFieldTransformer = ({ text }: { text: string }): string | null => {
  const trimmed = text.trim();
  const match = PLAIN_TEXT.exec(trimmed)?.[1] ?? GETTER_TEXT.exec(trimmed)?.[1];
  return match === undefined ? null : match;
};

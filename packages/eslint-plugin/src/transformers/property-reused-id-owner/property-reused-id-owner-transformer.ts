/**
 * PURPOSE: Reads which contract's id a property reuses from the property's source text, whether
 * written plainly (`questId: questContract.shape.id`) or as the getter a cycle needs
 * (`get questId(): … { return questContract.shape.id; }`). Any other value gives null.
 *
 * USAGE:
 * propertyReusedIdOwnerTransformer({ text: 'questId: questContract.shape.id' });
 * // Returns 'questContract'; null for 'questId: z.string()'
 */

const PLAIN_TEXT = /^[A-Za-z0-9_]+\s*:\s*([A-Za-z0-9_]+Contract)\.shape\.id$/u;
const GETTER_TEXT = /^get\s[\s\S]*return\s+([A-Za-z0-9_]+Contract)\.shape\.id\s*;?\s*\}$/u;

export const propertyReusedIdOwnerTransformer = ({ text }: { text: string }): string | null => {
  const trimmed = text.trim();
  const match = PLAIN_TEXT.exec(trimmed)?.[1] ?? GETTER_TEXT.exec(trimmed)?.[1];
  return match === undefined ? null : match;
};

/**
 * PURPOSE: Reduces a `z.object(...)` schema to one comparable string: every key with its value text,
 * brand calls and whitespace removed, sorted by key. Two objects with the same string have the same
 * keys and the same schemas once brand texts are ignored.
 *
 * USAGE:
 * objectSignatureLayerTransformer({ text: "z.object({ id: z.string().brand<'A'>() })" });
 * // Returns 'id:z.string()', or undefined when the schema has no keys
 */
import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import { schemaObjectEntriesReadTransformer } from '../schema-object-entries-read/schema-object-entries-read-transformer';

const BRAND_CALL = /\.brand<[^>]*>\(\)/gu;
const WHITESPACE = /\s+/gu;

export const objectSignatureLayerTransformer = ({
  text,
}: {
  text: ContentText;
}): ContentText | undefined => {
  const entries = schemaObjectEntriesReadTransformer({ text });
  return entries.length === 0
    ? undefined
    : contentTextContract.parse(
        entries
          .map(
            ({ key, valueText }) =>
              `${key}:${valueText.replace(BRAND_CALL, '').replace(WHITESPACE, '')}`,
          )
          .sort((left, right) => left.localeCompare(right))
          .join('|'),
      );
};

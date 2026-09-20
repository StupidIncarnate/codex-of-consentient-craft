/**
 * PURPOSE: Reduces one `results` row to the field names a caller listed in a query's `fields:
 * [...]`, or passes the row through unchanged when `fields` is `null` (chunk-03-read-path-and-
 * perception.md line 1207-1208). A row that fails to parse as a JSON object projects to `{}` for
 * any requested field, since there is nothing to pick a key off; a named field the row does not
 * carry is likewise just omitted rather than throwing — `results` rows come from six unrelated
 * shapes (console, network, ws, server, screenshots, steps) and no field vocabulary is common to
 * all of them, so this never validates a field name against what a particular row actually holds.
 *
 * USAGE:
 * resultRowProjectTransformer({
 *   row: ContentTextStub({ value: '{"status":200,"responseBody":"ok","requestBody":null}' }),
 *   fields: [ResultFieldStub({ value: 'status' }), ResultFieldStub({ value: 'responseBody' })],
 * });
 * // Returns '{"status":200,"responseBody":"ok"}' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { ResultField } from '../../contracts/result-field/result-field-contract';

export const resultRowProjectTransformer = ({
  row,
  fields,
}: {
  row: ContentText;
  fields: readonly ResultField[] | null;
}): ContentText => {
  if (fields === null) {
    return row;
  }

  const parsedUnknown: unknown = JSON.parse(row);
  const source: Record<PropertyKey, unknown> =
    typeof parsedUnknown === 'object' && parsedUnknown !== null
      ? (parsedUnknown as Record<PropertyKey, unknown>)
      : {};

  const projected = fields.reduce<Record<PropertyKey, unknown>>((accumulated, field) => {
    if (field in source) {
      accumulated[field] = source[field];
    }
    return accumulated;
  }, {});

  return contentTextContract.parse(JSON.stringify(projected));
};

/**
 * PURPOSE: One key on an ingredient's `fields` contract. Reach for this wherever a field is
 * referred to by NAME rather than carried by value — `links.as`, `transitions.field`,
 * `fromSaved.field`.
 *
 * USAGE:
 * fieldNameContract.parse('status');
 * // Returns a branded FieldName
 */
import { z } from 'zod';

export const fieldNameContract = z.string().min(1).brand<'FieldName'>();

export type FieldName = z.infer<typeof fieldNameContract>;

/**
 * PURPOSE: One line naming what an op does, for the front of a mid-run error message — a non-empty
 * string so a description can never silently go blank. Reach for this over a bare string anywhere an
 * op needs describing: a description that lost its own vocabulary could be mistaken for a row ref or
 * an ingredient name by the next reader.
 *
 * USAGE:
 * opDescriptionContract.parse('create quest[0:1]');
 * // Returns a branded OpDescription
 */
import { z } from 'zod';

export const opDescriptionContract = z.string().min(1).brand<'OpDescription'>();

export type OpDescription = z.infer<typeof opDescriptionContract>;

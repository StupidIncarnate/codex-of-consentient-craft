/**
 * PURPOSE: One line naming what an op does, for the front of a mid-run error message. Reach for
 * this over a bare string return anywhere `opDescribeTransformer` is called: a description that
 * lost its own vocabulary could be mistaken for a row ref or an ingredient name by the next reader.
 *
 * USAGE:
 * opDescriptionContract.parse('create quest[0:1]');
 * // Returns a branded OpDescription
 */
import { z } from 'zod';

export const opDescriptionContract = z.string().min(1).brand<'OpDescription'>();

export type OpDescription = z.infer<typeof opDescriptionContract>;

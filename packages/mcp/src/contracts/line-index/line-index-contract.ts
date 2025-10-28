import { z } from 'zod';

export const lineIndexContract = z.number().int().min(0).brand<'LineIndex'>();

export type LineIndex = z.infer<typeof lineIndexContract>;

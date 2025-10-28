import { z } from 'zod';

export const headerTextContract = z.string().brand<'HeaderText'>();

export type HeaderText = z.infer<typeof headerTextContract>;

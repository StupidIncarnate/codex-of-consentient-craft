import { z } from 'zod';

export const processOutputContract = z.string().brand<'ProcessOutput'>();

export type ProcessOutput = z.infer<typeof processOutputContract>;

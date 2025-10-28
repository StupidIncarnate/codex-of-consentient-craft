import { z } from 'zod';

export const errorMessageContract = z.string().brand<'ErrorMessage'>();

export type ErrorMessage = z.infer<typeof errorMessageContract>;

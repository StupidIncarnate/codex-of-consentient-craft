import { z } from 'zod';

export const parameterNameContract = z.string().brand<'ParameterName'>();

export type ParameterName = z.infer<typeof parameterNameContract>;

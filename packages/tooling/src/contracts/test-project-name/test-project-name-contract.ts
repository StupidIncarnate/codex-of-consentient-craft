import { z } from 'zod';

export const testProjectNameContract = z.string().min(1).brand<'TestProjectName'>();

export type TestProjectName = z.infer<typeof testProjectNameContract>;

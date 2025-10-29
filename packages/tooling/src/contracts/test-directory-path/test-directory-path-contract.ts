import { z } from 'zod';

export const testDirectoryPathContract = z.string().min(1).brand<'TestDirectoryPath'>();

export type TestDirectoryPath = z.infer<typeof testDirectoryPathContract>;

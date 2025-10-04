import type { z } from 'zod';
import type { WriteToolInput } from './write-tool-input-contract';
import { writeToolInputContract } from './write-tool-input-contract';

type UnbrandedInput<T extends z.ZodTypeAny> = Partial<z.input<T>>;

export const WriteToolInputStub = (
  overrides: UnbrandedInput<typeof writeToolInputContract> = {},
): WriteToolInput =>
  writeToolInputContract.parse({
    file_path: '/test/file.ts',
    content: '',
    ...overrides,
  });

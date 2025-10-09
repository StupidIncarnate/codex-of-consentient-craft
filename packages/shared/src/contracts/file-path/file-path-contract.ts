import { z } from 'zod';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { relativeFilePathContract } from '../relative-file-path/relative-file-path-contract';

export const filePathContract = z
  .union([absoluteFilePathContract, relativeFilePathContract])
  .brand<'FilePath'>();

export type FilePath = z.infer<typeof filePathContract>;

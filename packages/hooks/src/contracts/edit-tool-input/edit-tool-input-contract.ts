import { z } from 'zod';

export const editToolInputContract = z.object({
  file_path: z.string().min(1).brand<'FilePath'>(),
  old_string: z.string().brand<'OldString'>(),
  new_string: z.string().brand<'NewString'>(),
  replace_all: z.boolean().optional(),
});

export type EditToolInput = z.infer<typeof editToolInputContract>;

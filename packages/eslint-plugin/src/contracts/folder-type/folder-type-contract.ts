import { z } from 'zod';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';

const folderTypes = Object.keys(folderConfigStatics) as [
  keyof typeof folderConfigStatics,
  ...(keyof typeof folderConfigStatics)[],
];

export const folderTypeContract = z.enum(folderTypes).brand<'FolderType'>();

export type FolderType = z.infer<typeof folderTypeContract>;

import { dirname } from 'path';

export const pathDirname = ({ path }: { path: string }): string => dirname(path);

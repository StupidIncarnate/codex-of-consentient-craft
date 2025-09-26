import { resolve } from 'path';

export const pathResolve = ({ path }: { path: string }): string => resolve(path);

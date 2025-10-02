import { resolve } from 'path';

export const pathResolve = ({ paths }: { paths: string[] }): string => resolve(...paths);

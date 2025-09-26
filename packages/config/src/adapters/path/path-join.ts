import { join } from 'path';

export const pathJoin = ({ paths }: { paths: string[] }): string => join(...paths);

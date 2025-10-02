import { resolve } from 'path';
import { filePathContract, type FilePath } from '../../contracts/file-path/file-path-contract';

export const pathResolve = ({ paths }: { paths: string[] }): FilePath =>
  filePathContract.parse(resolve(...paths));

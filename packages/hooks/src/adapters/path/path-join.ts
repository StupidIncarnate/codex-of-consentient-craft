import { join } from 'path';
import { filePathContract, type FilePath } from '../../contracts/file-path/file-path-contract';

export const pathJoin = ({ paths }: { paths: string[] }): FilePath =>
  filePathContract.parse(join(...paths));

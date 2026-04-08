/**
 * PURPOSE: Stub factory for FileCount branded number type
 *
 * USAGE:
 * const count = FileCountStub({ value: 42 });
 * // Returns branded FileCount number
 */
import { fileCountContract, type FileCount } from './file-count-contract';

export const FileCountStub = ({ value }: { value: number } = { value: 42 }): FileCount =>
  fileCountContract.parse(value);
